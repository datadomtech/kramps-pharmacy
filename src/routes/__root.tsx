// noinspection HtmlRequiredTitleElement

import { HeadContent, Scripts, createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { FormDevtoolsPanel } from "@tanstack/react-form-devtools";
import { tableDevtoolsPlugin } from "@tanstack/react-table-devtools";
import appCss from "~/styles/app.css?url";
import { Toaster } from "sonner";
import { TooltipProvider } from "~/components/tooltip";
import { getSessionUser } from "~/server/auth";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
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
	beforeLoad: async () => {
		const session = await getSessionUser();

		return {
			session,
		};
	},
	notFoundComponent: () => <div>Route not found</div>,
	component: RootRoute,
});

function RootRoute() {
	return (
		<html lang="en" suppressHydrationWarning={true}>
			<head>
				<HeadContent />
			</head>
			<body className="selection:bg-emerald-600 selection:text-white">
				<Toaster closeButton={true} position="top-right" richColors={true} />
				<TooltipProvider delay={0}>
					<div className="isolate">
						<Outlet />
					</div>
				</TooltipProvider>
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
