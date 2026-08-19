import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { authComponent, createAuth } from "./auth";

export const addStaff = action({
	args: {
		fullName: v.string(),
		password: v.string(),
		email: v.string(),
		phoneNumber: v.string(),
		isActive: v.boolean(),
	},
	handler: async (ctx, args) => {
		const { auth } = await authComponent.getAuth(createAuth, ctx);

		return await auth.api.createUser({
			body: {
				email: args.email,
				name: args.fullName,
				password: args.password,
				role: "admin",
				data: {
					phoneNumber: args.phoneNumber,
				},
			},
		});
	},
});

export const listStaff = query({
	args: {},
	handler: async (ctx) => {
		const { auth, headers } = await authComponent.getAuth(createAuth, ctx);
		return await auth.api.listUsers({
			query: { limit: 200, offset: 0 },
			headers,
		});
	},
});
