import { query } from "./_generated/server";
import type { DataModel } from "./_generated/dataModel";
import type { GenericCtx } from "@convex-dev/better-auth";
import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import { betterAuth } from "better-auth/minimal";
import authConfig from "./auth.config";
import { convex } from "@convex-dev/better-auth/plugins";
import { admin } from "better-auth/plugins";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
	
	return betterAuth({
		baseURL: process.env.SITE_URL,
		database: authComponent.adapter(ctx),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		plugins: [admin(), convex({ authConfig })],
	});
};

export const getCurrentUser = query({
	args: {},
	handler: async (ctx) => {
		return await authComponent.getAuthUser(ctx);
	},
});
