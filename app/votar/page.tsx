"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Option {
  id: string
  title: string
  example: string
  description: string | null
}

export default function VotingPage() {
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [options, setOptions] = useState<Option[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [voted, setVoted] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/voting")
        const data = await res.json()
        if (data.success) {
          setSessionId(data.data.session.id)
          setOptions(data.data.options)
        }
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  const submit = async () => {
    if (!selected || !sessionId) return
    try {
      await fetch("/api/voting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cast_vote",
          sessionId,
          voterName: "Anonymous",
          optionId: selected,
        }),
      })
      setVoted(true)
    } catch (err) {
      console.error(err)
    }
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-700">Nenhuma votação ativa no momento.</p>
      </div>
    )
  }

  if (voted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-700 font-medium">Obrigado por votar!</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="max-w-md w-full p-6 space-y-4">
        <h1 className="text-xl font-bold text-slate-900 text-center">Escolha sua opção</h1>
        <div className="space-y-3">
          {options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`w-full text-left p-3 border rounded-md ${selected === opt.id ? "border-amber-500" : "border-slate-200"}`}
            >
              <div className="font-medium text-slate-900">{opt.title}</div>
              <div className="text-slate-600 text-sm">{opt.example}</div>
            </button>
          ))}
        </div>
        <Button onClick={submit} disabled={!selected} className="w-full">
          Enviar Voto
        </Button>
      </Card>
    </div>
  )
}
