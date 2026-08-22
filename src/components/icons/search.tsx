import type { SVGProps } from "react";

export const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
		<path d="M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0" opacity={0.1} fill="currentColor" />
		<path d="m15 15 6 6" />
		<path d="M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
	</svg>
);
