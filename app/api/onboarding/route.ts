import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { sessionId, adoption, prioritization, respondentInfo } = data

    // Preparar dados de priorização
    const priorityData = Object.entries(prioritization).reduce((acc, [key, value]: [string, any]) => {
      acc[`priority_${key.toLowerCase()}_selected`] = value.selected
      acc[`priority_${key.toLowerCase()}_impact`] = value.impact
      return acc
    }, {} as any)

    // Inserir ou atualizar resposta do questionário
    const result = await sql`
      INSERT INTO onboarding_responses (
        session_id,
        respondent_name,
        respondent_email,
        adoption_knowledge,
        adoption_tools,
        adoption_integration,
        adoption_automation,
        adoption_measurement,
        ${sql(Object.keys(priorityData).join(", "))},
        completed_at
      ) VALUES (
        ${sessionId},
        ${respondentInfo?.name || null},
        ${respondentInfo?.email || null},
        ${adoption.knowledge},
        ${adoption.tools},
        ${adoption.integration},
        ${adoption.automation},
        ${adoption.measurement},
        ${sql(Object.values(priorityData))},
        NOW()
      )
      ON CONFLICT (session_id) 
      DO UPDATE SET
        adoption_knowledge = EXCLUDED.adoption_knowledge,
        adoption_tools = EXCLUDED.adoption_tools,
        adoption_integration = EXCLUDED.adoption_integration,
        adoption_automation = EXCLUDED.adoption_automation,
        adoption_measurement = EXCLUDED.adoption_measurement,
        ${sql(
          Object.keys(priorityData)
            .map((key) => `${key} = EXCLUDED.${key}`)
            .join(", "),
        )},
        updated_at = NOW()
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      message: "Dados salvos com sucesso",
      id: result[0]?.id,
    })
  } catch (error) {
    console.error("Erro ao salvar dados do onboarding:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (sessionId) {
      // Buscar resposta específica
      const result = await sql`
        SELECT * FROM onboarding_responses 
        WHERE session_id = ${sessionId}
      `
      return NextResponse.json({ data: result[0] || null })
    } else {
      // Buscar estatísticas gerais
      const stats = await sql`
        SELECT 
          COUNT(*) as total_responses,
          AVG(adoption_knowledge) as avg_knowledge,
          AVG(adoption_tools) as avg_tools,
          AVG(adoption_integration) as avg_integration,
          AVG(adoption_automation) as avg_automation,
          AVG(adoption_measurement) as avg_measurement,
          SUM(CASE WHEN priority_a_selected THEN 1 ELSE 0 END) as priority_a_count,
          SUM(CASE WHEN priority_b_selected THEN 1 ELSE 0 END) as priority_b_count,
          SUM(CASE WHEN priority_c_selected THEN 1 ELSE 0 END) as priority_c_count,
          AVG(CASE WHEN priority_a_selected THEN priority_a_impact ELSE NULL END) as avg_impact_a,
          AVG(CASE WHEN priority_b_selected THEN priority_b_impact ELSE NULL END) as avg_impact_b,
          AVG(CASE WHEN priority_c_selected THEN priority_c_impact ELSE NULL END) as avg_impact_c
        FROM onboarding_responses 
        WHERE completed_at IS NOT NULL
      `

      return NextResponse.json({ data: stats[0] })
    }
  } catch (error) {
    console.error("Erro ao buscar dados do onboarding:", error)
    return NextResponse.json({ success: false, message: "Erro interno do servidor" }, { status: 500 })
  }
}
