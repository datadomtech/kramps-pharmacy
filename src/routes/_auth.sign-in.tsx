import { Button } from "~primitives/button";
import { Input, Field, Label } from "~components/input";
import { toast } from "sonner";
import { createFileRoute, Link, useLocation, useNavigate } from "@tanstack/react-router";
import type { LinkOptions } from "@tanstack/react-router";
import { useState } from "react";
import type { SubmitEvent } from "react";

import { Logo } from "~/components/logo";
import { Image } from "@unpic/react";
import { createSupabaseBrowserClient } from "~/lib/supabase/client";

export const Route = createFileRoute("/_auth/sign-in")({
	component: RouteComponent,
});

function RouteComponent() {
	const location = useLocation();

	const callbackUrl = location.search as Record<"redirect", LinkOptions["to"]>;

	const navigate = useNavigate();
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
		try {
			event.preventDefault();
			setSubmitting(true);

			const formData = new FormData(event.currentTarget);

			const supabase = createSupabaseBrowserClient();
			const { error } = await supabase.auth.signInWithPassword({
				email: formData.get("email") as string,
				password: formData.get("password") as string,
			});

			if (error) {
				throw error;
			}

			if (callbackUrl.redirect) {
				await navigate({ to: callbackUrl.redirect });
			}

			await navigate({ to: "/products" });
		} catch (err) {
			let toastTitle;

			if (err instanceof Error && err.name === "AuthApiError") {
				toastTitle = err.message;
			} else {
				toastTitle = "Could not sign in";
			}
			toast.error(toastTitle);
			setSubmitting(false);
		}
	};

	return (
		<div className="relative size-full">
			<main className="grid size-full text-gray-700 lg:h-lvh lg:grid-cols-3">
				<section className="flex h-full flex-col items-center justify-center p-6 lg:col-span-2 lg:p-10">
					<Link to="/" className="text-navy -mt-1 mb-auto flex self-start justify-self-start">
						<Logo className="h-9 w-auto text-brand" />
					</Link>

					<div className="mt-16 mb-auto w-full max-w-md pb-16">
						<h1 className="mb-8 text-2xl text-emerald-800 md:text-3xl">Sign In to KRAMPS PHARMACY</h1>

						<form className="mt-8 flex flex-col gap-6" onSubmit={(event) => handleSubmit(event)}>
							<input name="flow" value="signIn" type="hidden" />
							<Field>
								<Label htmlFor="email" className="block">
									Email
								</Label>
								<Input
									name="email"
									id="email"
									type="email"
									aria-label="Email"
									className="input-text mt-1! w-full p-2.5!"
									autoComplete="email"
								/>
							</Field>
							<Field>
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
								</div>
								<Input
									type="password"
									name="password"
									id="password"
									aria-label="Password"
									autoComplete="current-password"
									className="input-text mt-1! w-full! p-2.5!"
								/>
							</Field>

							<Button type="submit" disabled={submitting} className="btn-xl btn-primary mt-4 w-full bg-brand! text-white!">
								{submitting ? "Signing in" : "Sign in"}
							</Button>
						</form>
					</div>
				</section>

				<aside className="relative hidden h-full p-16 lg:block lg:w-md xl:w-lg">
					<Image
						src="/login-hero.svg"
						className="absolute inset-0 size-full max-w-none object-cover"
						alt="pharmacy illustration"
						layout="fullWidth"
					/>

					<blockquote className="font-heading relative z-20 text-2xl text-emerald-900">
						<p className="leading-tight">I am clinical</p>

						<p className="leading-tight">Pharmacist, what about you?</p>

						<p className="leading-tight">Am I cynical</p>

						<cite className="mt-6 block text-xl not-italic">
							<span className="opacity-40">—</span>A haiku by&nbsp;
							<Link
								to="."
								target="_blank"
								className="underline decoration-emerald-900/40 decoration-1 underline-offset-2 transition-colors hover:text-emerald-700 hover:decoration-emerald-700"
							>
								fawd
							</Link>
						</cite>
					</blockquote>
				</aside>
			</main>
		</div>
	);
}
