import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { createAuth } from "./auth";

export const addStaff = action({
	args: {
		fullName: v.string(),
		password: v.string(),
		email: v.string(),
		phoneNumber: v.string(),
	},
	handler: async (ctx, args) => {

		const auth = createAuth(ctx);

		const users = await auth.api.listUsers({ query: { limit: 100 } })

		if (users.total === 0) {
			const result = await auth.api.signUpEmail({
				body: {
					email: args.email,
					password: args.password,
					name: args.fullName
				}
			})

			return {
				id: result.user.userId,
				name: result.user.name
			}
		}

		const user = await auth.api.createUser({
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

		return {
			id: user.user.name,
			name: user.user.id
		}
	},
});

export const listStaff = query({
	args: {},
	handler: async (ctx) => {
		const auth = createAuth(ctx);
		return await auth.api.listUsers({
			query: { limit: 200, offset: 0 }
		});
	},
});
