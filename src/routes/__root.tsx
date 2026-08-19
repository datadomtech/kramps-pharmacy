// noinspection HtmlRequiredTitleElement

import { HeadContent, Scripts, createRootRouteWithContext, Outlet, useRouteContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";
import appCss from "~/styles/app.css?url";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/tooltip";
import { createServerFn } from "@tanstack/react-start";
import { getToken } from "~/auth-server.ts";
import type { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "~/auth-client.ts";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
	convexQueryClient: ConvexQueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Kramps Pharmacy",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	beforeLoad: async (ctx) => {
		const token = await getAuth();

		if (token) {
			ctx.context.convexQueryClient.serverHttpClient?.setAuth(token);
		}

		return {
			isAuthenticated: !!token,
			token,
		};
	},
	notFoundComponent: () => <div>Route not found</div>,
	component: RootRoute,
});

const getAuth = createServerFn({ method: "GET" }).handler(async () => {
	const token = await getToken();

	console.log("AUTH TOKEN:", token ? "present" : "missing");

	return token;
});

function RootRoute() {
	const context = useRouteContext({ from: Route.id });

	return (
		<html lang="en" suppressHydrationWarning={true}>
			<head>
				<HeadContent />
			</head>
			<body className="selection:bg-emerald-600 selection:text-white">
				<Toaster closeButton={true} position="top-right" richColors={true} />
				<ConvexBetterAuthProvider client={context.convexQueryClient.convexClient} authClient={authClient as any} initialToken={context.token}>
					<TooltipProvider delay={0}>
						<div className="isolate">
							<Outlet />
						</div>
					</TooltipProvider>
				</ConvexBetterAuthProvider>
				<TanStackDevtools
					plugins={[
						{
							name: "Query Devtools",
							render: <ReactQueryDevtoolsPanel />,
						},
						{
							name: "Router Devtools",
							render: <TanStackRouterDevtoolsPanel />,
						},
						{
							name: "Form Devtools",
							render: <FormDevtoolsPanel />,
						},
						tableDevtoolsPlugin(),
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
