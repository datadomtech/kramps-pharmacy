import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { devtools } from "@tanstack/devtools-vite";
import { nitro } from "nitro/vite";

export default defineConfig({
	server: {
		port: 3000,
	},
	resolve: {
		tsconfigPaths: true,
	},
	ssr: {
		noExternal: ["@convex-dev/better-auth", "@convex-dev/better-auth/plugins/oidc-provider"],
	},
	plugins: [tailwindcss(), devtools(), tanstackStart(), viteReact(), nitro()],
});
