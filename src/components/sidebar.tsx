import { SidebarGroup, SidebarContent } from "~selia/sidebar";
import { Button } from "~primitives/button";
import {
	BuildingIcon,
	CogIcon,
	DatabaseIcon,
	IdIcon,
	InboxInIcon,
	ChartIcon,
	BagIcon,
	CartIcon,
	TimerIcon,
	UserAddIcon,
	UserSquareIcon,
	UserXIcon,
	XIcon,
	PlusSquareIcon,
	GarageIcon,
} from "icons";
import { Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import type { FC, SVGProps } from "react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTrigger } from "./sheet";
import { Dialog } from "~primitives/dialog";
import { Logo } from "./logo";
import { BranchSelector } from "./branch-selector";

type IconType = FC<SVGProps<SVGSVGElement>>;

type SidebarRouteProps = {
	id: number;
	name: string;
	icon: IconType;
	href: LinkProps["to"];
	onClick?: () => void;
};

const SidebarRouteItem = ({ href: to, icon: Icon, name, onClick }: SidebarRouteProps) => (
	<Link
		to={to}
		onClick={onClick}
		className="group mt-0.5 flex w-full shrink-0 flex-row items-center justify-start gap-2 rounded-lg p-2 text-emerald-900/80 transition-colors hover:text-white lg:w-full lg:shrink-0 lg:flex-row lg:justify-items-start lg:gap-0.5 lg:gap-2.5 lg:px-2.5 lg:py-2 lg:text-emerald-900 lg:hover:bg-transparent lg:hover:text-emerald-600"
		activeOptions={{
			exact: true,
		}}
		activeProps={{
			"data-active": true,
			className:
				"transition-colors text-white bg-emerald-600/90 lg:hover:bg-emerald-500/20 lg:hover:text-emerald-700 lg:bg-emerald-500/20 lg:text-emerald-700 hover:bg-emerald-600/90 hover:text-emerald-700",
		}}
	>
		<span className="flex size-5 shrink-0 items-center justify-center lg:size-6 lg:justify-center lg:rounded-md lg:bg-linear-to-b lg:from-white/75 lg:to-emerald-100/75 lg:shadow-sm lg:ring-1 lg:shadow-emerald-800/10 lg:ring-emerald-800/10">
			<Icon className="size-5 fill-transparent stroke-emerald-500 stroke-2 lg:size-3.5" />
		</span>
		<span className="w-full truncate text-left text-btn font-btn capitalize lg:w-auto">{name}</span>
	</Link>
);

export const mobileSidebarHandle = Dialog.createHandle();

const dailyOperationsRoutes: Array<SidebarRouteProps> = [
	{ id: 1, name: "Sales", icon: BagIcon, href: "/sales" },
	{ id: 2, name: "Receive Stock", icon: PlusSquareIcon, href: "/receive-stock" },
];

// oxfmt-ignore
const customerRoutes: Array<SidebarRouteProps> = [
	{ id: 1, name: "New Customer", icon: UserAddIcon, href: "/customers/new" },
	{ id: 2, name: "Active Customers", icon: UserSquareIcon, href: "/customers" },
	{ id: 3, name: "Blacklisted Customers", icon: UserXIcon, href: "/customers/blacklist" },
];

const inventoryRoutes: Array<SidebarRouteProps> = [
	{ id: 1, name: "Inventory", icon: DatabaseIcon, href: "/inventory" },
	{ id: 2, name: "Expiry Tracker", icon: TimerIcon, href: "/expiry-tracker" },
	{ id: 3, name: "Products", icon: InboxInIcon, href: "/products" },
	// order is
	// really important or needed in this section
	{ id: 4, name: "Suppliers", icon: BuildingIcon, href: "/suppliers" },
	{ id: 5, name: "Reports", icon: ChartIcon, href: "/reports" },
];

const adminRoutes: Array<SidebarRouteProps> = [
	{ id: 1, name: "Staff", icon: IdIcon, href: "/staff" },
	{ id: 2, name: "Warehouse", icon: GarageIcon, href: "/warehouse" },
	{ id: 3, name: "Settings", icon: CogIcon, href: "/settings" },
];

export const Sidebar = () => (
	<div className="hidden! lg:block! lg:w-72! lg:max-w-72!">
		<SidebarContent className="py-0!">
			<SidebarGroup className="px-0 py-0!">
				<label className="m-0! mb-1! border-none text-btn font-btn text-gray-700 [&_div]:pl-0!">Branch</label>
				<BranchSelector />
			</SidebarGroup>

			<Link
				to="/pos"
				className="btn btn-brand mt-4 inline-flex w-full gap-2 font-medium shadow-none hover:text-white! focus:text-white lg:shadow-none"
			>
				<CartIcon className="size-4.5 fill-brand/10 stroke-logo" />
				Point of Sale
			</Link>

			<SidebarGroup className="mt-4 font-medium backdrop-blur-md lg:bg-transparent lg:px-0 lg:text-emerald-900">
				{dailyOperationsRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} />
				))}

				<Separator />

				{customerRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} />
				))}

				<Separator />

				{inventoryRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} />
				))}

				<Separator />

				{adminRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} />
				))}
			</SidebarGroup>
		</SidebarContent>
	</div>
);

export const Separator = () => (
	<hr className="my-3 hidden h-px w-full border-0 bg-linear-to-r from-emerald-800/5 via-emerald-800/20 to-emerald-800/5 lg:block" />
);

export const MobileSidebar = () => (
	<Sheet handle={mobileSidebarHandle} defaultOpen={false}>
		<SheetContent className="block h-full w-full border-brand! bg-logo lg:hidden" side="left">
			<SheetHeader className="flex h-10 items-center justify-between">
				<Logo className="h-9 text-white" aria-label="Logo" />

				<SheetClose className="rounded-full border border-solid border-gray-100 bg-transparent p-1.5 shadow-inner">
					<XIcon className="size-6 text-white" />
				</SheetClose>
			</SheetHeader>

			<div className="p-4">
				<label className="m-0! mb-1! border-none text-btn font-btn text-gray-100 [&_div]:pl-0!">Branch</label>
				<BranchSelector compact />
			</div>

			<div className="p-4">
				<Button className="btn btn-brand inline-flex w-full gap-2 font-medium hover:text-white! focus:text-white">
					<CartIcon className="size-4.5 fill-brand/10 stroke-logo" />
					Point of Sale
				</Button>
			</div>

			<div className="mt-4 space-y-4 px-4 font-medium backdrop-blur-md lg:bg-transparent lg:px-0 lg:text-emerald-900">
				{dailyOperationsRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} onClick={() => mobileSidebarHandle.close()} />
				))}

				<Separator />

				{customerRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} onClick={() => mobileSidebarHandle.close()} />
				))}

				<Separator />

				{inventoryRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} onClick={() => mobileSidebarHandle.close()} />
				))}

				<Separator />

				{adminRoutes.map((route) => (
					<SidebarRouteItem key={route.id} {...route} onClick={() => mobileSidebarHandle.close()} />
				))}
			</div>
		</SheetContent>
	</Sheet>
);

export const MobileSidebarTrigger = () => (
	<SheetTrigger handle={mobileSidebarHandle} className="block lg:hidden">
		<Logo className="h-10 w-full stroke-brand text-brand" />
	</SheetTrigger>
);
