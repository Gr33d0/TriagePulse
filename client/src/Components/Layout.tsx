import type { ReactNode } from 'react';

type LayoutProps = {
	children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
	const path = typeof window === 'undefined' ? '' : window.location.pathname.toLowerCase();
	const dashboardActive = path.includes('dashboard');

	const linkStyle = (active: boolean) => ({
		display: 'block',
		padding: '12px 14px',
		borderRadius: 8,
		color: active ? '#1d4ed8' : '#475569',
		backgroundColor: active ? '#eff6ff' : 'transparent',
		fontWeight: active ? 600 : 500,
		textDecoration: 'none',
	});

	return (
		<div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
			<header
				style={{
					height: 64,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					padding: '0 24px',
					background: '#fff',
					borderBottom: '1px solid #e2e8f0',
				}}
			>
				<a href="/" style={{ color: '#1d4ed8', fontSize: 20, fontWeight: 700, textDecoration: 'none' }}>
					TriagePulse
				</a>
				<span style={{ color: '#64748b', fontSize: 14 }}>Painel de atendimento</span>
			</header>

			<div style={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
				<aside
					style={{
						width: 240,
						flexShrink: 0,
						padding: 20,
						background: '#fff',
						borderRight: '1px solid #e2e8f0',
					}}
				>
					<nav aria-label="Navegação principal" style={{ display: 'grid', gap: 6 }}>
						<a href="/inbox" style={linkStyle(!dashboardActive)} aria-current={!dashboardActive ? 'page' : undefined}>
							Caixa de entrada
						</a>
						<a href="/dashboard" style={linkStyle(dashboardActive)} aria-current={dashboardActive ? 'page' : undefined}>
							Dashboard
						</a>
					</nav>
				</aside>

				<main style={{ flex: 1, minWidth: 0, padding: 32 }}>{children}</main>
			</div>
		</div>
	);
}
