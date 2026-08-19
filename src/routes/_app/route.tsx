import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Navbar } from "~/components/navbar";
import { MobileSidebar, Sidebar } from "~/components/sidebar";
// import { convexQuery } from "@convex-dev/react-query";
// import { api } from "~convex/_generated/api";

export const Route = createFileRoute("/_app")({
	// beforeLoad: async ({ context }) => {
	// 	const user = await context.queryClient.ensureQueryData(convexQuery(api.auth.getCurrentUser, {}));
	//
	// 	console.dir({ userInApp: user });
	//
	// 	if (!user) {
	// 		throw redirect({ to: "/sign-in" });
	// 	}
	//
	// 	return user;
	// },
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<Navbar />
			<section className="flex min-h-[calc(100lvh-64px)] w-full flex-col gap-4 bg-linear-to-r/oklch from-logo/70 via-white to-brand/30 px-4 py-4 sm:px-8 lg:flex-row lg:gap-6 lg:overflow-visible lg:py-6 lg:pb-8">
				<Sidebar />
				<MobileSidebar />
				<Outlet />
			</section>
		</>
	);
}
