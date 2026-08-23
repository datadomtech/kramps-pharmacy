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
		dedupe: ["react", "react-dom"],
		alias: [
			{
				find: "use-sync-external-store/shim/with-selector",
				replacement: new URL("./src/shims/use-sync-external-store/with-selector.ts", import.meta.url).pathname,
			},
			{
				find: "use-sync-external-store/shim",
				replacement: new URL("./src/shims/use-sync-external-store/shim.ts", import.meta.url).pathname,
			},
			{
				find: /^use-sync-external-store$/,
				replacement: new URL("./src/shims/use-sync-external-store/shim.ts", import.meta.url).pathname,
			},
		],
	},
	plugins: [tanstackStart(), tailwindcss(), devtools(), nitro({ preset: "vercel" }), viteReact()],
});
