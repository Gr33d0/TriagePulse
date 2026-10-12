const mensagens = [
	{ id: 1, nome: "Mariana Costa", assunto: "Problema com meu pedido", urgencia: "Alta" },
	{ id: 2, nome: "Rafael Mendes", assunto: "Dúvida sobre pagamento", urgencia: "Média" },
	{ id: 3, nome: "Camila Souza", assunto: "Atualização cadastral", urgencia: "Baixa" },
];

const estilosUrgencia: Record<string, string> = {
	Alta: "bg-red-100 text-red-700",
	Média: "bg-amber-100 text-amber-700",
	Baixa: "bg-emerald-100 text-emerald-700",
};

export default function Inbox() {
	return (
		<main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
			<section className="mx-auto max-w-5xl">
				<header className="mb-8">
					<p className="text-sm font-semibold text-indigo-600">Atendimento</p>
					<h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
						Caixa de entrada
					</h1>
					<p className="mt-2 text-slate-500">
						Consulte as mensagens e identifique o nível de urgência.
					</p>
				</header>

				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
						<h2 className="font-semibold text-slate-900">Mensagens recentes</h2>
						<span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
							{mensagens.length} mensagens
						</span>
					</div>

					<div className="overflow-x-auto">
						<table className="w-full min-w-[560px] text-left">
							<thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
								<tr>
									<th scope="col" className="px-6 py-3 font-semibold">Nome</th>
									<th scope="col" className="px-6 py-3 font-semibold">Assunto</th>
									<th scope="col" className="px-6 py-3 font-semibold">Nível de urgência</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{mensagens.map((mensagem) => (
									<tr key={mensagem.id} className="transition-colors hover:bg-slate-50">
										<td className="whitespace-nowrap px-6 py-4 font-medium text-slate-900">
											{mensagem.nome}
										</td>
										<td className="px-6 py-4 text-slate-600">{mensagem.assunto}</td>
										<td className="px-6 py-4">
											<span
												className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${estilosUrgencia[mensagem.urgencia]}`}
											>
												{mensagem.urgencia}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</main>
	);
}
