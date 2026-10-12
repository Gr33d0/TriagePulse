import { useState, type FormEvent } from "react";

type AuthFormProps = {
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateAccount({ onSubmit }: AuthFormProps) {
	return (
		<form onSubmit={onSubmit}>
			<h2>Criar conta</h2>
			<label htmlFor="create-name">Nome</label>
			<input id="create-name" name="name" type="text" autoComplete="name" required />

			<label htmlFor="create-email">E-mail</label>
			<input id="create-email" name="email" type="email" autoComplete="email" required />

			<label htmlFor="create-password">Senha</label>
			<input
				id="create-password"
				name="password"
				type="password"
				autoComplete="new-password"
				minLength={8}
				required
			/>
			<button type="submit">Criar conta</button>
		</form>
	);
}

export function SignIn({ onSubmit }: AuthFormProps) {
	return (
		<form onSubmit={onSubmit}>
			<h2>Entrar</h2>
			<label htmlFor="signin-email">E-mail</label>
			<input id="signin-email" name="email" type="email" autoComplete="email" required />

			<label htmlFor="signin-password">Senha</label>
			<input
				id="signin-password"
				name="password"
				type="password"
				autoComplete="current-password"
				required
			/>
			<button type="submit">Entrar</button>
		</form>
	);
}

export default function Login() {
	const [mode, setMode] = useState<"signin" | "register">("signin");

	function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
	}

	return (
		<main>
			<nav aria-label="Acesso à conta">
				<button type="button" onClick={() => setMode("signin")} aria-pressed={mode === "signin"}>
					Entrar
				</button>
				<button
					type="button"
					onClick={() => setMode("register")}
					aria-pressed={mode === "register"}
				>
					Criar conta
				</button>
			</nav>
			{mode === "signin" ? (
				<SignIn onSubmit={handleSubmit} />
			) : (
				<CreateAccount onSubmit={handleSubmit} />
			)}
		</main>
	);
}
