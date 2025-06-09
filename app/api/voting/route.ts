import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { action, sessionId, voterName, voterEmail, optionId } = data

    console.log("API de votação chamada com ação:", action)

    if (action === "create_session") {
      // Criar nova sessão de votação
      const result = await sql`
        INSERT INTO voting_sessions (title, description, status)
        VALUES (
          'Votação de Prioridades IA',
          'Escolha da solução de IA prioritária para implementação',
          'waiting'
        )
        RETURNING id
      `

      console.log("Sessão criada com ID:", result[0]?.id)
      return NextResponse.json({
        success: true,
        sessionId: result[0]?.id,
      })
    }

    if (action === "start_voting") {
      // Iniciar votação
      await sql`
        UPDATE voting_sessions 
        SET status = 'voting', updated_at = NOW()
        WHERE id = ${sessionId}
      `

      console.log("Votação iniciada para sessão:", sessionId)
      return NextResponse.json({ success: true })
    }

    if (action === "cast_vote") {
      // Registrar voto
      await sql`
        INSERT INTO votes (session_id, voter_name, voter_email, option_id)
        VALUES (${sessionId}, ${voterName}, ${voterEmail || null}, ${optionId})
      `

      console.log("Voto registrado:", { sessionId, voterName, optionId })
      return NextResponse.json({ success: true })
    }

    if (action === "end_voting") {
      // Finalizar votação
      await sql`
        UPDATE voting_sessions 
        SET status = 'completed', updated_at = NOW()
        WHERE id = ${sessionId}
      `

      console.log("Votação encerrada para sessão:", sessionId)
      return NextResponse.json({ success: true })
    }

    console.log("Ação não reconhecida:", action)
    return NextResponse.json({ success: false, message: "Ação não reconhecida" }, { status: 400 })
  } catch (error) {
    console.error("Erro na API de votação:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      const active = await sql`SELECT id FROM voting_sessions WHERE status = 'voting' ORDER BY created_at DESC LIMIT 1`
      if (active.length === 0) {
        return NextResponse.json({ success: false, message: "Nenhuma sessão ativa" }, { status: 404 })
      }
      sessionId = String(active[0].id)
    }

    console.log("Buscando dados da sessão:", sessionId)

    // Buscar resultados da votação
    const [session, votes, voteCounts] = await Promise.all([
      sql`SELECT * FROM voting_sessions WHERE id = ${sessionId}`,
      sql`
        SELECT voter_name, option_id, voted_at 
        FROM votes 
        WHERE session_id = ${sessionId}
        ORDER BY voted_at DESC
      `,
      sql`
        SELECT 
          option_id,
          COUNT(*) as vote_count
        FROM votes 
        WHERE session_id = ${sessionId}
        GROUP BY option_id
      `,
    ])

    // Buscar opções de votação
    const options = await sql`SELECT * FROM voting_options`

    // Organizar dados de contagem
    const voteData = {
      optionA: 0,
      optionB: 0,
      optionC: 0,
    }

    voteCounts.forEach((count: any) => {
      if (count.option_id in voteData) {
        voteData[count.option_id as keyof typeof voteData] = Number.parseInt(count.vote_count)
      }
    })

    console.log("Dados de votação recuperados:", {
      sessionExists: session.length > 0,
      totalVotes: votes.length,
      voteData,
    })

    return NextResponse.json({
      success: true,
      data: {
        session: session[0],
        votes: voteData,
        voterList: votes,
        options: options,
        totalVotes: votes.length,
      },
    })
  } catch (error) {
    console.error("Erro ao buscar dados de votação:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Erro interno do servidor",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
