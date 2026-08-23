import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Navbar } from "~/components/navbar";
import { MobileSidebar, Sidebar } from "~/components/sidebar";

export const Route = createFileRoute("/_app")({
	beforeLoad: ({ context }) => {
		if (!context.session) {
			throw redirect({ to: "/sign-in" });
		}

		return { session: context.session };
	},
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
