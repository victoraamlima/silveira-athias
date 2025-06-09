"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle, ChevronLeft, ChevronRight, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import NextImage from "next/image"
import AdoptionStep from "@/components/steps/adoption-step"
import PrioritizationStep from "@/components/steps/prioritization-step"
import CompletionStep from "@/components/steps/completion-step"

const steps = [
	{
		id: "welcome",
		title: "Diagnóstico & Prioridades de IA",
		description: "3 minutos para preencher — todas as perguntas são de múltipla escolha",
	},
	{
		id: "adoption",
		title: "Nível Atual de Adoção de IA",
		description: "Marque 1 número por item (0 = nunca testamos | 5 = integrado aos KPIs)",
	},
	{
		id: "prioritization",
		title: "Priorização de Soluções",
		description: "Marque ✅ se faz sentido e dê nota de Impacto 0-5",
	},
	{
		id: "completion",
		title: "Diagnóstico Concluído",
		description: "Seu plano de 15 dias está pronto",
	},
]

export default function OnboardingWizard() {
	const [currentStep, setCurrentStep] = useState(0)
	const [formData, setFormData] = useState({
		adoption: {
			knowledge: 0,
			tools: 0,
			integration: 0,
			automation: 0,
			measurement: 0,
		},
		prioritization: {
			A: { selected: false, impact: 0 },
			B: { selected: false, impact: 0 },
			C: { selected: false, impact: 0 },
			D: { selected: false, impact: 0 },
			E: { selected: false, impact: 0 },
			F: { selected: false, impact: 0 },
		},
	})

	const [sessionId] = useState(() => {
		if (typeof window !== "undefined") {
			let id = localStorage.getItem("onboardingSessionId")
			if (!id) {
				id = Math.random().toString(36).substring(2, 15)
				localStorage.setItem("onboardingSessionId", id)
			}
			return id
		}
		return ""
	})

	const updateFormData = (section: string, data: any) => {
		setFormData((prev) => {
			const updated = { ...prev, [section]: data }
			// Envia para a API a cada alteração
			fetch("/api/onboarding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId,
					adoption: updated.adoption,
					prioritization: updated.prioritization,
					respondentInfo: {}, // Adapte se quiser coletar nome/email
				}),
			}).catch((err) => {
				console.error("Erro ao salvar dados:", err)
			})
			return updated
		})
	}

	const nextStep = () => {
		if (currentStep < steps.length - 1) {
			setCurrentStep(currentStep + 1)
			window.scrollTo(0, 0)
		}
	}

	const prevStep = () => {
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1)
			window.scrollTo(0, 0)
		}
	}

	const renderStepContent = () => {
		switch (currentStep) {
			case 0:
				return <WelcomeStep />
			case 1:
				return <AdoptionStep data={formData.adoption} updateData={(data) => updateFormData("adoption", data)} />
			case 2:
				return (
					<PrioritizationStep
						data={formData.prioritization}
						updateData={(data) => updateFormData("prioritization", data)}
					/>
				)
			case 3:
				return <CompletionStep formData={formData} />
			default:
				return null
		}
	}

	const isStepComplete = () => {
		switch (currentStep) {
			case 0:
				return true
			case 1:
				return Object.values(formData.adoption).every((value) => value > 0)
			case 2:
				return Object.values(formData.prioritization).some((item) => item.selected && item.impact > 0)
			default:
				return true
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 py-4 md:py-8">
			<div className="container mx-auto px-4 max-w-5xl">
				{/* Logo - Aumentada */}
				<div className="flex justify-center mb-6">
					<NextImage
						src="/images/logo.png"
						alt="Silveira Athias"
						width={600}
						height={180}
						className="h-20 md:h-24 w-auto"
					/>
				</div>

				<div className="mb-6 md:mb-8">
					<ProgressBar currentStep={currentStep} totalSteps={steps.length - 1} />
				</div>

				<Card className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-2xl rounded-xl overflow-hidden">
					<div className="p-4 md:p-6 lg:p-8">
						<div className="mb-6">
							<h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900">
								{steps[currentStep].title}
							</h2>
							<p className="text-slate-700 mt-2 text-sm md:text-base">
								{steps[currentStep].description}
							</p>
						</div>

						<AnimatePresence mode="wait">
							<motion.div
								key={currentStep}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3 }}
								className="mb-6 md:mb-8"
							>
								{renderStepContent()}
							</motion.div>
						</AnimatePresence>

						<div className="flex justify-between mt-6 md:mt-8 gap-4">
							<Button
								variant="outline"
								onClick={prevStep}
								disabled={currentStep === 0}
								className="flex items-center gap-2 bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 px-4 py-2 md:px-6 md:py-3"
							>
								<ChevronLeft className="h-4 w-4" />
								<span className="hidden sm:inline">Anterior</span>
							</Button>

							<Button
								onClick={nextStep}
								disabled={!isStepComplete()}
								className={`flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 ${
									currentStep === steps.length - 1
										? "bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600"
										: "bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500"
								} border-0 shadow-lg text-white`}
							>
								<span className="hidden sm:inline">
									{currentStep === steps.length - 1 ? "Concluir" : "Próximo"}
								</span>
								<span className="sm:hidden">
									{currentStep === steps.length - 1 ? "✓" : "→"}
								</span>
								{currentStep === steps.length - 1 ? (
									<CheckCircle className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
				</Card>

				{/* Footer VanguardIA */}
				<Footer />
			</div>
		</div>
	)
}

function WelcomeStep() {
	return (
		<div className="py-6">
			<div className="flex justify-center mb-8">
				<div className="relative">
					<motion.div
						initial={{ scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{ duration: 0.5 }}
						className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-slate-700 to-slate-800 rounded-full flex items-center justify-center border-4 border-amber-400/30 backdrop-blur-md"
					>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ delay: 0.3, duration: 0.5 }}
						>
							<Unlock className="h-12 w-12 md:h-16 md:w-16 text-amber-400" />
						</motion.div>
					</motion.div>
				</div>
			</div>

			<motion.div
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.4, duration: 0.5 }}
			>
				<h3 className="text-lg md:text-xl font-semibold text-center mb-4 text-slate-900">
					📋 Formulário Rápido — Diagnóstico & Prioridades de IA
				</h3>

				<p className="text-slate-700 text-center mb-6 text-sm md:text-base">
					<strong className="text-amber-600">3 minutos para preencher</strong> — todas as perguntas são de múltipla
					escolha
				</p>

				<div className="bg-slate-100/80 backdrop-blur-md border border-slate-200 rounded-lg p-4 mb-6">
					<h4 className="font-medium text-amber-600 mb-3">O que faremos com suas respostas:</h4>
					<ul className="space-y-2">
						<li className="flex items-start gap-2">
							<span className="text-cyan-600 font-bold">🎯</span>
							<span className="text-slate-700 text-sm md:text-base">
								<strong className="text-slate-900">Prioridades</strong> – somaremos o impacto dos itens ✅ e
								selecionaremos os 3 mais valiosos
							</span>
						</li>
						<li className="flex items-start gap-2">
							<span className="text-cyan-600 font-bold">📅</span>
							<span className="text-slate-700 text-sm md:text-base">
								<strong className="text-slate-900">Próximos Passos</strong> – apresentaremos um plano de 15 dias com
								responsáveis e cronograma
							</span>
						</li>
					</ul>
				</div>

				<p className="text-center text-slate-600 text-sm md:text-base">
					Clique em "Próximo" para começar o diagnóstico rápido de IA.
				</p>
			</motion.div>
		</div>
	)
}

function ProgressBar({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
	const progress = (currentStep / totalSteps) * 100

	return (
		<div className="relative pt-1">
			<div className="flex items-center justify-between mb-2">
				<div>
					<span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-amber-600 bg-white/80 backdrop-blur-md border border-slate-200">
						Progresso
					</span>
				</div>
				<div className="text-right">
					<span className="text-xs font-semibold inline-block text-amber-600">{Math.round(progress)}%</span>
				</div>
			</div>
			<div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-white/80 backdrop-blur-md border border-slate-200">
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${progress}%` }}
					transition={{ duration: 0.5 }}
					className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-amber-500 to-cyan-600"
				/>
			</div>
			<div className="flex justify-between">
				{Array.from({ length: totalSteps + 1 }).map((_, index) => (
					<div key={index} className="flex flex-col items-center">
						<div
							className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
								index <= currentStep
									? "bg-gradient-to-r from-amber-500 to-cyan-600 border-amber-500 text-white"
									: "bg-white/80 border-slate-300 text-slate-600"
							}`}
						>
							{index < currentStep ? (
								<CheckCircle className="h-4 w-4" />
							) : (
								<span className="text-xs font-medium">{index + 1}</span>
							)}
						</div>
						{index < totalSteps && (
							<div className="hidden sm:block text-xs mt-1 text-slate-600">
								{steps[index + 1].title.split(" ")[0]}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	)
}

function Footer() {
	return (
		<motion.footer
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.5, duration: 0.8 }}
			className="mt-12 pt-8 border-t border-slate-200"
		>
			<div className="flex flex-col items-center gap-4">
				<div className="flex items-center gap-3">
					{/* Logo VanguardIA aumentada em 2x */}
					<NextImage
						src="/images/vanguardia-logo.png"
						alt="VanguardIA"
						width={240}
						height={80}
						className="h-16 w-auto"
					/>
				</div>
				<div className="text-center">
					<p className="text-slate-600 text-sm">
						Desenvolvido com 💙 pela{" "}
						<strong className="text-blue-600">VanguardIA</strong>
					</p>
					<p className="text-slate-500 text-xs mt-1">
						Transformando o futuro jurídico com Inteligência Artificial
					</p>
				</div>
			</div>
		</motion.footer>
	)
}
