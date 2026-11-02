import { useEffect, useState } from "react";

type DashboardEmail = {
	id: number;
	email: string;
	title: string;
	urgency: "High" | "Medium" | "Low" | null;
};

type DashboardData = {
	total_emails: number;
	urgent_emails: number;
	awaiting_reply: number;
	replies_sent: number;
	volume: { date: string; count: number }[];
	recent_emails: DashboardEmail[];
};

const metricStyles = [
	{ icon: "✉", tone: "blue" },
	{ icon: "!", tone: "rose" },
	{ icon: "◷", tone: "amber" },
	{ icon: "✓", tone: "green" },
];

const metricIconStyles: Record<string, string> = {
	blue: "bg-indigo-50 text-indigo-700",
	rose: "bg-red-50 text-red-700",
	amber: "bg-amber-50 text-amber-700",
	green: "bg-emerald-50 text-emerald-700",
};

const urgencyStyles: Record<string, string> = {
	High: "bg-red-100 text-red-700",
	Medium: "bg-amber-100 text-amber-700",
	Low: "bg-emerald-100 text-emerald-700",
};

export default function Dashboard() {
	const [data, setData] = useState<DashboardData | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		async function loadDashboard() {
			try {
				const response = await fetch("/api/dashboard_metrics", {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`Could not load dashboard metrics (HTTP ${response.status}).`);
				}
				setData(await response.json());
			} catch (requestError) {
				if (requestError instanceof Error && requestError.name === "AbortError") {
					return;
				}
				setError(
					requestError instanceof Error
						? requestError.message
						: "An error occurred while loading dashboard metrics.",
				);
			}
		}

		void loadDashboard();
		return () => controller.abort();
	}, []);

	const metrics = data
		? [
				{ label: "Emails received", value: data.total_emails },
				{ label: "High priority", value: data.urgent_emails },
				{ label: "Awaiting reply", value: data.awaiting_reply },
				{ label: "Replies sent", value: data.replies_sent },
			]
		: [];
	const chartValues = data?.volume ?? [];
	const maxVolume = Math.max(1, ...chartValues.map((day) => day.count));
	const chartCoordinates = chartValues.map((day, index) => ({
		x: chartValues.length > 1 ? (index / (chartValues.length - 1)) * 432 : 216,
		y: 112 - (day.count / maxVolume) * 98,
	}));
	const chartPoints = chartCoordinates.map(({ x, y }) => `${x},${y}`).join(" ");

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-10 font-sans text-slate-900 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-6xl">
				<header className="mb-[30px]">
					<p className="mb-[7px] text-xs font-bold uppercase tracking-[.09em] text-indigo-600">
						TriagePulse · Overview
					</p>
					<h1 className="text-[clamp(25px,3vw,32px)] font-bold tracking-[-.04em]">
						Email support overview
					</h1>
					<p className="mt-[7px] text-sm text-slate-500">
						Live metrics from the emails stored in your inbox.
					</p>
				</header>

				{error && (
					<p className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
						{error}
					</p>
				)}

				<section className="mb-5 grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4" aria-label="Email metrics">
					{metrics.map((metric, index) => (
						<article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" key={metric.label}>
							<div className="flex items-center justify-between gap-2 text-[13px] font-semibold text-slate-500">
								<span>{metric.label}</span>
								<span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl text-[19px] ${metricIconStyles[metricStyles[index].tone]}`}>
									{metricStyles[index].icon}
								</span>
							</div>
							<div className="my-2 mt-[17px] text-2xl font-bold tracking-[-.04em] sm:text-[29px]">
								{metric.value.toLocaleString()}
							</div>
							<div className="text-xs text-slate-500">All stored email records</div>
						</article>
					))}
					{!data && !error && (
						<p className="col-span-full py-6 text-center text-sm text-slate-500">Loading dashboard metrics...</p>
					)}
				</section>

				<section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]">
					<article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
						<div>
							<h2 className="text-base font-bold">Email volume</h2>
							<p className="mt-1.5 text-xs text-slate-500">Emails received in the last 7 days</p>
						</div>
						{chartValues.length > 0 ? (
							<div className="mt-5 h-[220px]" role="img" aria-label="Email volume over the last seven days">
								<svg className="h-[185px] w-full overflow-visible" viewBox="0 0 432 130" preserveAspectRatio="none">
									<defs>
										<linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
											<stop offset="0%" stopColor="#6366f1" stopOpacity=".2" />
											<stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
										</linearGradient>
									</defs>
									{[20, 55, 90, 125].map((y) => (
										<line key={y} x1="0" x2="432" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
									))}
									<polygon points={`0,130 ${chartPoints} 432,130`} fill="url(#chartFill)" />
									<polyline points={chartPoints} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
									{chartCoordinates.map(({ x, y }, index) => (
										<circle key={chartValues[index].date} cx={x} cy={y} r="3.5" fill="white" stroke="#6366f1" strokeWidth="2" />
									))}
								</svg>
								<div className="flex justify-between text-[11px] text-slate-400">
									{chartValues.map((day) => (
										<span key={day.date} title={`${day.count} emails`}>
											{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
										</span>
									))}
								</div>
							</div>
						) : (
							<p className="py-16 text-center text-sm text-slate-500">
								{data ? "No emails received in the last 7 days." : "Loading email volume..."}
							</p>
						)}
					</article>

					<article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
						<div className="flex items-start justify-between gap-3">
							<div>
								<h2 className="text-base font-bold">Recent emails</h2>
								<p className="mt-1.5 text-xs text-slate-500">Latest messages in your inbox</p>
							</div>
							<a href="/inbox" className="text-xs font-bold text-indigo-600">View inbox</a>
						</div>
						<div className="mt-[19px]">
							{data?.recent_emails.length ? (
								data.recent_emails.map((email) => (
									<div className="flex items-center gap-[11px] border-b border-slate-100 py-[13px] last:border-0" key={email.id}>
										<div className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-slate-100 text-[11px] font-extrabold text-slate-600">
											{email.urgency === "High" ? "!" : "✉"}
										</div>
										<div className="min-w-0 flex-1">
											<p className="truncate text-[13px] font-bold">{email.title || "(No subject)"}</p>
											<p className="mt-1 truncate text-[11px] text-slate-400">{email.email}</p>
										</div>
										<span className={`whitespace-nowrap rounded-[7px] px-2 py-1.5 text-[10px] font-bold ${urgencyStyles[email.urgency ?? ""] ?? "bg-slate-100 text-slate-500"}`}>
											{email.urgency ?? "Not analyzed"}
										</span>
									</div>
								))
							) : (
								<p className="py-8 text-center text-sm text-slate-500">
									{data ? "No emails found." : "Loading recent emails..."}
								</p>
							)}
						</div>
					</article>
				</section>

				<aside className="mt-5 flex items-center gap-[13px] rounded-xl border border-indigo-100 bg-indigo-50 px-[17px] py-[15px] text-xs text-indigo-900">
					<span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl bg-white text-[19px] text-indigo-600">ⓘ</span>
					<div>
						<strong className="mb-[3px] block text-[13px] text-indigo-900">Metrics reflect stored email data</strong>
						Urgency counts include emails already analyzed by the LLM.
					</div>
				</aside>
			</div>
		</main>
	);
}
