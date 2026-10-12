const metrics = [
	{ label: "Pacientes atendidos", value: "1.284", change: "+12,8%", icon: "♙", tone: "blue" },
	{ label: "Em espera", value: "38", change: "−4,3%", icon: "◷", tone: "amber" },
	{ label: "Tempo médio", value: "18 min", change: "−2 min", icon: "⌁", tone: "purple" },
	{ label: "Alta hoje", value: "96", change: "+8,2%", icon: "✓", tone: "green" },
];

const cases = [
	{ initials: "ML", name: "Mariana Lima", detail: "Dor abdominal · 12:42", priority: "Urgente", color: "rose" },
	{ initials: "RC", name: "Rafael Costa", detail: "Febre · 12:35", priority: "Moderado", color: "amber" },
	{ initials: "AS", name: "Ana Souza", detail: "Tosse persistente · 12:18", priority: "Baixo", color: "green" },
	{ initials: "PM", name: "Pedro Martins", detail: "Enxaqueca · 11:56", priority: "Moderado", color: "amber" },
];

const chartPoints = "0,112 48,94 96,103 144,62 192,76 240,46 288,59 336,25 384,39 432,14";

const metricIconStyles: Record<string, string> = {
	blue: "bg-[#edf2ff] text-[#5275de]",
	amber: "bg-[#fff5e6] text-[#d89326]",
	purple: "bg-[#f3edff] text-[#8c64d8]",
	green: "bg-[#e8f8f0] text-[#2ca875]",
};

const priorityStyles: Record<string, string> = {
	rose: "bg-[#fff0f0] text-[#d85c5c]",
	amber: "bg-[#fff6e8] text-[#c98a23]",
	green: "bg-[#eaf8f1] text-[#29956a]",
};

export default function Dashboard() {
	return (
		<main className="min-h-screen bg-[#f5f7fb] p-4 font-sans text-[#182230] sm:p-[22px] min-[851px]:p-8">
			<div className="mx-auto max-w-[1240px]">
				<header className="mb-[30px] flex flex-col items-start justify-between gap-5 min-[521px]:flex-row min-[521px]:items-center">
					<div>
						<p className="mb-[7px] text-xs font-bold uppercase tracking-[.09em] text-[#788397]">TriagePulse · Visão geral</p>
						<h1 className="text-[clamp(25px,3vw,32px)] font-bold tracking-[-.04em]">Bom dia, equipe 👋</h1>
						<p className="mt-[7px] text-sm text-[#7c8798]">Acompanhe o fluxo de atendimento da sua unidade.</p>
					</div>
					<div className="flex w-full items-center justify-between gap-3 min-[521px]:w-auto">
						<div className="flex h-[42px] items-center gap-[9px] rounded-[11px] border border-[#e7ebf2] bg-white px-[13px] text-[13px] font-semibold text-[#526075]"><span>▦</span> Hoje, 24 de outubro</div>
						<div className="flex h-[42px] items-center gap-[9px] rounded-[11px] border border-[#e7ebf2] bg-white px-[13px] text-[13px] font-semibold text-[#526075]"><span className="grid h-[34px] w-[34px] place-items-center rounded-full bg-[#e6edff] text-xs font-extrabold text-[#4168d7]">JS</span> Júlia Santos</div>
					</div>
				</header>

				<section className="mb-5 grid grid-cols-2 gap-2.5 min-[521px]:gap-4 min-[851px]:grid-cols-4" aria-label="Indicadores do dia">
					{metrics.map((metric) => (
						<article className="rounded-[15px] border border-[#e9edf3] bg-white p-[15px] shadow-[0_3px_12px_rgba(27,46,77,0.025)] min-[521px]:p-5" key={metric.label}>
							<div className="flex items-center justify-between text-[13px] font-semibold text-[#788397]">
								<span>{metric.label}</span>
								<span className={`grid h-[38px] w-[38px] place-items-center rounded-[11px] text-[19px] ${metricIconStyles[metric.tone]}`}>{metric.icon}</span>
							</div>
							<div className="my-2 mt-[17px] text-2xl font-bold tracking-[-.04em] min-[521px]:text-[29px]">{metric.value}</div>
							<div className="flex items-center gap-[7px] text-xs text-[#8a94a4]"><span className="font-bold text-[#24a16c]">{metric.change}</span><span>em relação a ontem</span></div>
						</article>
					))}
				</section>

				<section className="grid grid-cols-1 gap-5 min-[851px]:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
					<article className="rounded-[15px] border border-[#e9edf3] bg-white p-[17px] shadow-[0_3px_12px_rgba(27,46,77,0.025)] min-[521px]:p-[22px]">
						<div className="flex items-start justify-between gap-3">
							<div><h2 className="text-base font-bold">Volume de atendimentos</h2><p className="mt-1.5 text-xs text-[#8a94a4]">Pacientes triados ao longo do dia</p></div>
							<button className="rounded-lg border border-[#e9edf3] bg-white px-2.5 py-2 text-xs text-[#667286]" type="button">Últimos 7 dias⌄</button>
						</div>
						<div className="mt-5 h-[220px]" role="img" aria-label="Gráfico de atendimentos crescente ao longo da semana">
							<svg className="h-[185px] w-full overflow-visible" viewBox="0 0 432 130" preserveAspectRatio="none">
								<defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6b8af0" stopOpacity=".2"/><stop offset="100%" stopColor="#6b8af0" stopOpacity="0"/></linearGradient></defs>
								{[20, 55, 90, 125].map((y) => <line key={y} x1="0" x2="432" y1={y} y2={y} stroke="#edf0f5" strokeDasharray="4 5" />)}
								<polygon points={`0,130 ${chartPoints} 432,130`} fill="url(#chartFill)" />
								<polyline points={chartPoints} fill="none" stroke="#6483e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								{[0, 48, 96, 144, 192, 240, 288, 336, 384, 432].map((x, i) => <circle key={x} cx={x} cy={[112, 94, 103, 62, 76, 46, 59, 25, 39, 14][i]} r="3.5" fill="white" stroke="#6483e8" strokeWidth="2" />)}
							</svg>
							<div className="flex justify-between text-[11px] text-[#9ba4b2]"><span>08h</span><span>10h</span><span>12h</span><span>14h</span><span>16h</span><span>18h</span></div>
						</div>
					</article>

					<article className="rounded-[15px] border border-[#e9edf3] bg-white p-[17px] shadow-[0_3px_12px_rgba(27,46,77,0.025)] min-[521px]:p-[22px]">
						<div className="flex items-start justify-between gap-3">
							<div><h2 className="text-base font-bold">Atendimentos recentes</h2><p className="mt-1.5 text-xs text-[#8a94a4]">Pacientes aguardando triagem</p></div>
							<button className="cursor-pointer border-0 bg-transparent text-xs font-bold text-[#5275de]" type="button">Ver todos</button>
						</div>
						<div className="mt-[19px]">
							{cases.map((patient) => (
								<div className="flex items-center gap-[11px] border-b border-[#f0f2f6] py-[13px] last:border-0" key={patient.name}>
									<div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-[#f0f3f8] text-[11px] font-extrabold text-[#68758b]">{patient.initials}</div>
									<div className="min-w-0 flex-1"><p className="text-[13px] font-bold">{patient.name}</p><p className="mt-1 text-[11px] text-[#929baa]">{patient.detail}</p></div>
									<span className={`whitespace-nowrap rounded-[7px] px-2 py-1.5 text-[10px] font-bold ${priorityStyles[patient.color]}`}>{patient.priority}</span>
								</div>
							))}
						</div>
					</article>
				</section>

				<aside className="mt-5 flex items-center gap-[13px] rounded-[13px] border border-[#e6ebfa] bg-[#f0f4ff] px-[17px] py-[15px] text-xs text-[#526487]">
					<span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[#edf2ff] text-[19px] text-[#5275de]">ⓘ</span>
					<div><strong className="mb-[3px] block text-[13px] text-[#35496f]">Unidade funcionando normalmente</strong>Equipe completa e todos os setores operacionais.</div>
				</aside>
			</div>
		</main>
	);
}
