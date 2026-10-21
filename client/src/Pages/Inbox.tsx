import { useEffect, useState } from "react";

type Urgency = "High" | "Medium" | "Low";

type AnalyzedEmail = {
	id: number;
	email: string;
	title: string;
	summary: string;
	urgency: Urgency;
};

type AnalyzedEmailsResponse = {
	emails: AnalyzedEmail[];
};

const urgencyStyles: Record<Urgency, string> = {
	High: "bg-red-100 text-red-700",
	Medium: "bg-amber-100 text-amber-700",
	Low: "bg-emerald-100 text-emerald-700",
};

export default function Inbox() {
	const [emails, setEmails] = useState<AnalyzedEmail[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		async function loadEmails() {
			try {
				const response = await fetch("/api/analyze_emails?limit=50", {
					signal: controller.signal,
				});
				if (!response.ok) {
					throw new Error(`Could not analyze emails (HTTP ${response.status}).`);
				}

				const data: AnalyzedEmailsResponse = await response.json();
				setEmails(data.emails);
			} catch (requestError) {
				if (requestError instanceof Error && requestError.name === "AbortError") {
					return;
				}
				setError(
					requestError instanceof Error
						? requestError.message
						: "An error occurred while loading emails.",
				);
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		}

		void loadEmails();
		return () => controller.abort();
	}, []);

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
			<section className="mx-auto max-w-6xl">
				<header className="mb-8">
					<p className="text-sm font-semibold text-indigo-600">Support</p>
					<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
						Inbox
					</h1>
					<p className="mt-2 text-slate-500">
						Emails analyzed by AI with a summary and urgency level.
					</p>
				</header>

				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
						<h2 className="font-semibold text-slate-900">Recent emails</h2>
						<span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
							{isLoading ? "Loading..." : `${emails.length} emails`}
						</span>
					</div>

					{error ? (
						<p className="px-6 py-8 text-sm text-red-700" role="alert">{error}</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[760px] text-left">
								<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
									<tr>
										<th scope="col" className="px-6 py-3 font-semibold">Sender</th>
										<th scope="col" className="px-6 py-3 font-semibold">Subject</th>
										<th scope="col" className="px-6 py-3 font-semibold">Summary</th>
										<th scope="col" className="px-6 py-3 font-semibold">Urgency</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-slate-100">
									{isLoading ? (
										<tr>
											<td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
												Analyzing emails...
											</td>
										</tr>
									) : emails.length === 0 ? (
										<tr>
											<td className="px-6 py-8 text-center text-slate-500" colSpan={4}>
												No emails found in the database.
											</td>
										</tr>
									) : (
										emails.map((email) => (
											<tr key={email.id} className="align-top transition-colors hover:bg-slate-50">
												<td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
													{email.email}
												</td>
												<td className="px-6 py-4 text-slate-600">{email.title}</td>
												<td className="max-w-md px-6 py-4 text-slate-600">{email.summary}</td>
												<td className="px-6 py-4">
													<span
														className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyStyles[email.urgency]}`}
													>
														{email.urgency}
													</span>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</main>
	);
}
