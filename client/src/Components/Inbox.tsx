import { Fragment, useEffect, useState, type SubmitEvent } from "react";

type Urgency = "High" | "Medium" | "Low";

type AnalyzedEmail = {
	id: number;
	email: string;
	title: string;
	received_at: string;
	summary: string;
	urgency: Urgency;
	can_reply: boolean;
};

type AnalyzedEmailsResponse = {
	emails: AnalyzedEmail[];
};

const DEFAULT_REPLY_TEMPLATE =
	"Hello,\n\nThank you for contacting us about {subject}. We will be happy to help.\n\nKind regards";
const REPLY_TEMPLATE_STORAGE_KEY = "triagepulse.reply-template";

const urgencyStyles: Record<Urgency, string> = {
	High: "bg-red-100 text-red-700",
	Medium: "bg-amber-100 text-amber-700",
	Low: "bg-emerald-100 text-emerald-700",
};

export default function Inbox() {
	const [emails, setEmails] = useState<AnalyzedEmail[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [urgencyFilter, setUrgencyFilter] = useState<"all" | Urgency>("all");
	const [senderFilter, setSenderFilter] = useState("");
	const [receivedDateFilter, setReceivedDateFilter] = useState("");
	const [replyingTo, setReplyingTo] = useState<number | null>(null);
	const [replyTemplate, setReplyTemplate] = useState(
		() => localStorage.getItem(REPLY_TEMPLATE_STORAGE_KEY) ?? DEFAULT_REPLY_TEMPLATE,
	);
	const [replyBody, setReplyBody] = useState("");
	const [isSending, setIsSending] = useState(false);
	const [isSuggesting, setIsSuggesting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [notice, setNotice] = useState<string | null>(null);

	useEffect(() => {
		const controller = new AbortController();

		async function loadEmails() {
			try {
				await analyzeEmails(controller.signal);
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

	async function analyzeEmails(signal?: AbortSignal) {
		const response = await fetch("/api/analyze_emails?limit=50", { signal });
		if (!response.ok) {
			throw new Error(`Could not analyze emails (HTTP ${response.status}).`);
		}

		const data: AnalyzedEmailsResponse = await response.json();
		setEmails(data.emails);
		setError(null);
	}

	async function refreshEmails() {
		setIsRefreshing(true);
		setError(null);
		try {
			const response = await fetch("/api/get_emails");
			if (!response.ok) {
				throw new Error(`Could not fetch new emails (HTTP ${response.status}).`);
			}
			await analyzeEmails();
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "An error occurred while refreshing emails.",
			);
		} finally {
			setIsRefreshing(false);
		}
	}

	async function suggestReply(emailId: number) {
		setIsSuggesting(true);
		setError(null);
		setNotice(null);
		try {
			const response = await fetch(`/api/emails/${emailId}/suggest-reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ style_example: replyTemplate }),
			});
			const result: { suggestion?: string; detail?: string } = await response.json();
			if (!response.ok) {
				throw new Error(result.detail ?? `Could not draft reply (HTTP ${response.status}).`);
			}
			if (!result.suggestion) {
				throw new Error("The AI did not return a reply suggestion.");
			}
			setReplyBody(result.suggestion);
			setNotice("AI suggestion added to the draft. Review it before sending.");
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "An error occurred while drafting the reply.",
			);
		} finally {
			setIsSuggesting(false);
		}
	}

	async function sendReply(event: SubmitEvent<HTMLFormElement>, emailId: number) {
		event.preventDefault();
		setIsSending(true);
		setError(null);
		setNotice(null);
		try {
			const response = await fetch(`/api/emails/${emailId}/reply`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ body: replyBody }),
			});
			if (!response.ok) {
				const result: { detail?: string } = await response.json();
				throw new Error(result.detail ?? `Could not send reply (HTTP ${response.status}).`);
			}
			setReplyingTo(null);
			setReplyBody("");
			setNotice("Reply sent successfully.");
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "An error occurred while sending the reply.",
			);
		} finally {
			setIsSending(false);
		}
	}

	function saveReplyTemplate() {
		localStorage.setItem(REPLY_TEMPLATE_STORAGE_KEY, replyTemplate);
		setNotice("Reply template saved in this browser.");
	}

	function applyReplyTemplate(email: AnalyzedEmail) {
		return replyTemplate
			.replaceAll("{subject}", email.title)
			.replaceAll("{email}", email.email);
	}

	const filteredEmails = emails.filter((email) => {
		const matchesUrgency =
			urgencyFilter === "all" || email.urgency === urgencyFilter;
		const matchesSender = email.email
			.toLocaleLowerCase()
			.includes(senderFilter.trim().toLocaleLowerCase());
		const receivedAt = new Date(email.received_at);
		const emailLocalDate = [
			receivedAt.getFullYear(),
			String(receivedAt.getMonth() + 1).padStart(2, "0"),
			String(receivedAt.getDate()).padStart(2, "0"),
		].join("-");
		const matchesDate =
			!receivedDateFilter || emailLocalDate === receivedDateFilter;

		return matchesUrgency && matchesSender && matchesDate;
	});

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
			<section className="mx-auto max-w-6xl">
				<header className="mb-8">
					<p className="text-sm font-semibold text-indigo-600">Support</p>
					<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
						Inbox
					</h1>
					<p className="mt-2 text-slate-500">
						Fetch unread emails from the configured Gmail inbox and analyze them. Fetched emails are marked as read.
					</p>
				</header>

				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-4">
						<h2 className="font-semibold text-slate-900">Recent emails</h2>
						<div className="flex items-center gap-3">
							<span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
								{isLoading
									? "Loading..."
									: filteredEmails.length === emails.length
										? `${emails.length} emails`
										: `${filteredEmails.length} of ${emails.length} emails`}
							</span>
							<button
								type="button"
								onClick={refreshEmails}
								disabled={isLoading || isRefreshing || isSending}
								className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isRefreshing ? "Fetching and analyzing..." : "Fetch new emails"}
							</button>
						</div>
					</div>

					{error && (
						<p className="px-6 py-4 text-sm text-red-700" role="alert">{error}</p>
					)}
					<section className="space-y-3 border-b border-slate-200 bg-slate-50 px-6 py-4">
						<div>
							<h3 className="text-sm font-semibold text-slate-800">Reply template</h3>
							<p className="mt-1 text-xs text-slate-500">
								Use {"{subject}"} and {"{email}"} as placeholders. The template is saved in this browser.
								It also guides the tone and structure of AI reply suggestions.
							</p>
						</div>
						<textarea
							aria-label="Reply template"
							value={replyTemplate}
							onChange={(event) => setReplyTemplate(event.target.value)}
							rows={3}
							maxLength={10000}
							className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
						/>
						<button
							type="button"
							onClick={saveReplyTemplate}
							className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
						>
							Save template
						</button>
					</section>
					<section
						aria-label="Filter emails"
						className="flex flex-wrap items-end gap-4 border-b border-slate-200 px-6 py-4"
					>
						<div className="space-y-1">
							<label htmlFor="filter-urgency" className="block text-xs font-semibold text-slate-600">
								Priority
							</label>
							<select
								id="filter-urgency"
								value={urgencyFilter}
								onChange={(event) =>
									setUrgencyFilter(event.target.value as "all" | Urgency)
								}
								className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
							>
								<option value="all">All priorities</option>
								<option value="High">High</option>
								<option value="Medium">Medium</option>
								<option value="Low">Low</option>
							</select>
						</div>
						<div className="space-y-1">
							<label htmlFor="filter-sender" className="block text-xs font-semibold text-slate-600">
								Sender
							</label>
							<input
								id="filter-sender"
								type="search"
								value={senderFilter}
								onChange={(event) => setSenderFilter(event.target.value)}
								placeholder="Search sender"
								className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
							/>
						</div>
						<div className="space-y-1">
							<label htmlFor="filter-date" className="block text-xs font-semibold text-slate-600">
								Received date
							</label>
							<input
								id="filter-date"
								type="date"
								value={receivedDateFilter}
								onChange={(event) => setReceivedDateFilter(event.target.value)}
								className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
							/>
						</div>
						<button
							type="button"
							onClick={() => {
								setUrgencyFilter("all");
								setSenderFilter("");
								setReceivedDateFilter("");
							}}
							disabled={
								urgencyFilter === "all" &&
								!senderFilter &&
								!receivedDateFilter
							}
							className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Clear filters
						</button>
					</section>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[760px] text-left">
							<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
								<tr>
									<th scope="col" className="px-6 py-3 font-semibold">Sender</th>
									<th scope="col" className="px-6 py-3 font-semibold">Subject</th>
									<th scope="col" className="px-6 py-3 font-semibold">Received</th>
									<th scope="col" className="px-6 py-3 font-semibold">Summary</th>
									<th scope="col" className="px-6 py-3 font-semibold">Priority</th>
									<th scope="col" className="px-6 py-3 font-semibold">Reply</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{isLoading || isRefreshing ? (
									<tr>
										<td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
											{isRefreshing ? "Fetching and analyzing emails..." : "Analyzing emails..."}
										</td>
									</tr>
								) : emails.length === 0 ? (
									<tr>
										<td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
											No emails found in the database.
										</td>
									</tr>
								) : filteredEmails.length === 0 ? (
									<tr>
										<td className="px-6 py-8 text-center text-slate-500" colSpan={6}>
											No emails match these filters.
										</td>
									</tr>
								) : (
									filteredEmails.map((email) => (
										<Fragment key={email.id}>
											<tr className="align-top transition-colors hover:bg-slate-50">
												<td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
													{email.email}
												</td>
												<td className="px-6 py-4 text-slate-600">{email.title}</td>
												<td className="whitespace-nowrap px-6 py-4 text-slate-600">
													<time dateTime={email.received_at}>
														{new Date(email.received_at).toLocaleString("pt-PT", {
															dateStyle: "short",
															timeStyle: "short",
														})}
													</time>
												</td>
												<td className="max-w-md px-6 py-4 text-slate-600">{email.summary}</td>
												<td className="px-6 py-4">
													<span
														className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${urgencyStyles[email.urgency]}`}
													>
														{email.urgency}
													</span>
												</td>
												<td className="px-6 py-4">
													{email.can_reply ? (
														<button
															type="button"
															disabled={isSending}
															onClick={() => {
																setReplyingTo(replyingTo === email.id ? null : email.id);
																setReplyBody(applyReplyTemplate(email));
																setError(null);
																setNotice(null);
															}}
															className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-60"
															aria-expanded={replyingTo === email.id}
														>
															{replyingTo === email.id ? "Cancel" : "Reply"}
														</button>
													) : (
														<span className="text-slate-400">—</span>
													)}
												</td>
											</tr>
											{replyingTo === email.id && email.can_reply && (
												<tr>
													<td className="bg-slate-50 px-6 py-4" colSpan={6}>
														<form
															onSubmit={(event) => void sendReply(event, email.id)}
															className="space-y-3"
														>
															<label
																htmlFor={`reply-${email.id}`}
																className="block text-sm font-semibold text-slate-700"
															>
																Reply to {email.email}
															</label>
															<textarea
																id={`reply-${email.id}`}
																value={replyBody}
																onChange={(event) => setReplyBody(event.target.value)}
																maxLength={10000}
																rows={4}
																required
																disabled={isSending}
																className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-100"
																placeholder="Write your reply..."
															/>
															<button
																type="submit"
																disabled={isSending || isSuggesting || !replyBody.trim()}
																className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
															>
																{isSending ? "Sending..." : "Send reply"}
															</button>
															<button
																type="button"
																onClick={() => void suggestReply(email.id)}
																disabled={isSending || isSuggesting}
																className="ml-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60"
															>
																{isSuggesting ? "Drafting..." : "Suggest with AI"}
															</button>
														</form>
													</td>
												</tr>
											)}
										</Fragment>
									))
								)}
							</tbody>
						</table>
					</div>
					{notice && (
						<p className="px-6 py-4 text-sm text-emerald-700" role="status">{notice}</p>
					)}
				</div>
			</section>
		</main>
	);
}
