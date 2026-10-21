import type { ReactNode } from 'react';

type Page = 'dashboard' | 'inbox';

type LayoutProps = {
	children: ReactNode;
	currentPage: Page;
	onPageChange: (page: Page) => void;
};

export default function Layout({ children, currentPage, onPageChange }: LayoutProps) {
	const linkClassName = (active: boolean) =>
		`block rounded-lg px-3.5 py-3 ${
			active
				? 'bg-blue-50 font-semibold text-blue-700'
				: 'font-medium text-slate-600 hover:bg-slate-50'
		}`;

	return (
		<div className="min-h-screen bg-slate-50 font-sans text-slate-900">
			<header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
				<a href="/" className="text-xl font-bold text-blue-700 no-underline">
					TriagePulse
				</a>
				<span className="text-sm text-slate-500">Support dashboard</span>
			</header>

			<div className="flex min-h-[calc(100vh-4rem)]">
				<aside className="w-60 shrink-0 border-r border-slate-200 bg-white p-5">
					<nav aria-label="Main navigation" className="grid gap-1.5">
						<a
							href="/inbox"
							onClick={(event) => {
								event.preventDefault();
								onPageChange('inbox');
							}}
							className={linkClassName(currentPage === 'inbox')}
							aria-current={currentPage === 'inbox' ? 'page' : undefined}
						>
							Inbox
						</a>
						<a
							href="/dashboard"
							onClick={(event) => {
								event.preventDefault();
								onPageChange('dashboard');
							}}
							className={linkClassName(currentPage === 'dashboard')}
							aria-current={currentPage === 'dashboard' ? 'page' : undefined}
						>
							Dashboard
						</a>
					</nav>
				</aside>

				<main className="min-w-0 flex-1 p-8">{children}</main>
			</div>
		</div>
	);
}
