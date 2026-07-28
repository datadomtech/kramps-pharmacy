import { createFileRoute } from "@tanstack/react-router";
// import { Authenticated } from "convex/react";
import { Navbar } from "~/components/navbar";
import { Sidebar } from "~/components/sidebar";

export const Route = createFileRoute("/_app")({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			{/* <Authenticated>*/}
			<Navbar />
			<section className="flex min-h-[calc(100lvh-64px)] w-full flex-col gap-4 bg-linear-to-r/oklch from-logo/70 via-white to-brand/30 px-4 py-4 sm:px-8 lg:flex-row lg:gap-6 lg:overflow-visible lg:py-6 lg:pb-8">
				<Sidebar />
				{/* <MobileSidebar />*/}
			</section>
			{/* </Authenticated>*/}
		</>
	);
}
