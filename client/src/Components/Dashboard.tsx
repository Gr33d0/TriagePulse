import React from "react";

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

export default function Dashboard() {
	return (
		<main className="dashboard">
			<style>{`
				* { box-sizing: border-box; }
				.dashboard { min-height: 100vh; padding: 32px; background: #f5f7fb; color: #182230; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
				.dash-wrap { max-width: 1240px; margin: 0 auto; }
				.topbar { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 30px; }
				.eyebrow { margin: 0 0 7px; color: #788397; font-size: 12px; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; }
				.title { margin: 0; font-size: clamp(25px, 3vw, 32px); letter-spacing: -.04em; }
				.subtitle { margin: 7px 0 0; color: #7c8798; font-size: 14px; }
				.toolbar { display: flex; align-items: center; gap: 12px; }
				.date-chip, .user-chip { height: 42px; display: flex; align-items: center; gap: 9px; padding: 0 13px; border: 1px solid #e7ebf2; border-radius: 11px; background: white; color: #526075; font-size: 13px; font-weight: 600; }
				.avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: #e6edff; color: #4168d7; font-size: 12px; font-weight: 800; }
				.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 20px; }
				.card { border: 1px solid #e9edf3; border-radius: 15px; background: white; box-shadow: 0 3px 12px rgba(27, 46, 77, .025); }
				.metric { padding: 20px; }
				.metric-head { display: flex; justify-content: space-between; align-items: center; color: #788397; font-size: 13px; font-weight: 600; }
				.metric-icon { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 11px; font-size: 19px; }
				.blue { background: #edf2ff; color: #5275de; } .amber { background: #fff5e6; color: #d89326; } .purple { background: #f3edff; color: #8c64d8; } .green { background: #e8f8f0; color: #2ca875; }
				.metric-value { margin: 17px 0 8px; font-size: 29px; font-weight: 750; letter-spacing: -.04em; }
				.metric-foot { display: flex; align-items: center; gap: 7px; color: #8a94a4; font-size: 12px; }
				.positive { color: #24a16c; font-weight: 700; }
				.content-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(280px, 1fr); gap: 20px; }
				.panel { padding: 22px; }
				.panel-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
				.panel-title { margin: 0; font-size: 16px; font-weight: 700; }
				.panel-caption { margin: 6px 0 0; color: #8a94a4; font-size: 12px; }
				.select { padding: 8px 10px; border: 1px solid #e9edf3; border-radius: 8px; background: white; color: #667286; font-size: 12px; }
				.chart { height: 220px; margin-top: 20px; }
				.chart svg { width: 100%; height: 185px; overflow: visible; }
				.chart-labels { display: flex; justify-content: space-between; color: #9ba4b2; font-size: 11px; }
				.case-list { margin-top: 19px; }
				.case { display: flex; align-items: center; gap: 11px; padding: 13px 0; border-bottom: 1px solid #f0f2f6; }
				.case:last-child { border-bottom: 0; }
				.case-avatar { width: 38px; height: 38px; display: grid; place-items: center; flex: 0 0 auto; border-radius: 12px; background: #f0f3f8; color: #68758b; font-size: 11px; font-weight: 800; }
				.case-info { min-width: 0; flex: 1; }
				.case-name { margin: 0; font-size: 13px; font-weight: 700; }
				.case-detail { margin: 4px 0 0; color: #929baa; font-size: 11px; }
				.badge { padding: 6px 8px; border-radius: 7px; font-size: 10px; font-weight: 700; white-space: nowrap; }
				.badge.rose { background: #fff0f0; color: #d85c5c; } .badge.amber { background: #fff6e8; color: #c98a23; } .badge.green { background: #eaf8f1; color: #29956a; }
				.link { border: 0; background: none; color: #5275de; font-size: 12px; font-weight: 700; cursor: pointer; }
				.notice { display: flex; align-items: center; gap: 13px; margin-top: 20px; padding: 15px 17px; border: 1px solid #e6ebfa; border-radius: 13px; background: #f0f4ff; color: #526487; font-size: 12px; }
				.notice strong { display: block; margin-bottom: 3px; color: #35496f; font-size: 13px; }
				@media (max-width: 850px) { .dashboard { padding: 22px; } .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .content-grid { grid-template-columns: 1fr; } }
				@media (max-width: 520px) { .dashboard { padding: 16px; } .topbar { align-items: flex-start; flex-direction: column; } .toolbar { width: 100%; justify-content: space-between; } .metrics { gap: 10px; } .metric { padding: 15px; } .metric-value { font-size: 24px; } .panel { padding: 17px; } }
			`}</style>

			<div className="dash-wrap">
				<header className="topbar">
					<div>
						<p className="eyebrow">TriagePulse · Visão geral</p>
						<h1 className="title">Bom dia, equipe 👋</h1>
						<p className="subtitle">Acompanhe o fluxo de atendimento da sua unidade.</p>
					</div>
					<div className="toolbar">
						<div className="date-chip"><span>▦</span> Hoje, 24 de outubro</div>
						<div className="user-chip"><span className="avatar">JS</span> Júlia Santos</div>
					</div>
				</header>

				<section className="metrics" aria-label="Indicadores do dia">
					{metrics.map((metric) => (
						<article className="card metric" key={metric.label}>
							<div className="metric-head"><span>{metric.label}</span><span className={`metric-icon ${metric.tone}`}>{metric.icon}</span></div>
							<div className="metric-value">{metric.value}</div>
							<div className="metric-foot"><span className="positive">{metric.change}</span><span>em relação a ontem</span></div>
						</article>
					))}
				</section>

				<section className="content-grid">
					<article className="card panel">
						<div className="panel-heading">
							<div><h2 className="panel-title">Volume de atendimentos</h2><p className="panel-caption">Pacientes triados ao longo do dia</p></div>
							<button className="select" type="button">Últimos 7 dias⌄</button>
						</div>
						<div className="chart" role="img" aria-label="Gráfico de atendimentos crescente ao longo da semana">
							<svg viewBox="0 0 432 130" preserveAspectRatio="none">
								<defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6b8af0" stopOpacity=".2"/><stop offset="100%" stopColor="#6b8af0" stopOpacity="0"/></linearGradient></defs>
								{[20, 55, 90, 125].map((y) => <line key={y} x1="0" x2="432" y1={y} y2={y} stroke="#edf0f5" strokeDasharray="4 5" />)}
								<polygon points={`0,130 ${chartPoints} 432,130`} fill="url(#chartFill)" />
								<polyline points={chartPoints} fill="none" stroke="#6483e8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
								{[0, 48, 96, 144, 192, 240, 288, 336, 384, 432].map((x, i) => <circle key={x} cx={x} cy={[112, 94, 103, 62, 76, 46, 59, 25, 39, 14][i]} r="3.5" fill="white" stroke="#6483e8" strokeWidth="2" />)}
							</svg>
							<div className="chart-labels"><span>08h</span><span>10h</span><span>12h</span><span>14h</span><span>16h</span><span>18h</span></div>
						</div>
					</article>

					<article className="card panel">
						<div className="panel-heading">
							<div><h2 className="panel-title">Atendimentos recentes</h2><p className="panel-caption">Pacientes aguardando triagem</p></div>
							<button className="link" type="button">Ver todos</button>
						</div>
						<div className="case-list">
							{cases.map((patient) => (
								<div className="case" key={patient.name}>
									<div className="case-avatar">{patient.initials}</div>
									<div className="case-info"><p className="case-name">{patient.name}</p><p className="case-detail">{patient.detail}</p></div>
									<span className={`badge ${patient.color}`}>{patient.priority}</span>
								</div>
							))}
						</div>
					</article>
				</section>

				<aside className="notice"><span className="metric-icon blue">ⓘ</span><div><strong>Unidade funcionando normalmente</strong>Equipe completa e todos os setores operacionais.</div></aside>
			</div>
		</main>
	);
}
