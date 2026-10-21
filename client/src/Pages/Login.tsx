import { useState, type FormEvent } from "react";

type AuthFormProps = {
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function CreateAccount({ onSubmit }: AuthFormProps) {
	return (
		<form onSubmit={onSubmit}>
			<h2>Create account</h2>
			<label htmlFor="create-name">Name</label>
			<input id="create-name" name="name" type="text" autoComplete="name" required />

			<label htmlFor="create-email">Email</label>
			<input id="create-email" name="email" type="email" autoComplete="email" required />

			<label htmlFor="create-password">Password</label>
			<input
				id="create-password"
				name="password"
				type="password"
				autoComplete="new-password"
				minLength={8}
				required
			/>
			<button type="submit">Create account</button>
		</form>
	);
}

export function SignIn({ onSubmit }: AuthFormProps) {
	return (
		<form onSubmit={onSubmit}>
			<h2>Sign in</h2>
			<label htmlFor="signin-email">Email</label>
			<input id="signin-email" name="email" type="email" autoComplete="email" required />

			<label htmlFor="signin-password">Password</label>
			<input
				id="signin-password"
				name="password"
				type="password"
				autoComplete="current-password"
				required
			/>
			<button type="submit">Sign in</button>
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
			<nav aria-label="Account access">
				<button type="button" onClick={() => setMode("signin")} aria-pressed={mode === "signin"}>
					Sign in
				</button>
				<button
					type="button"
					onClick={() => setMode("register")}
					aria-pressed={mode === "register"}
				>
					Create account
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
