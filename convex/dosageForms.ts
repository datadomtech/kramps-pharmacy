import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

const mutateDosageArgs = {
	name: v.string(),
	description: v.nullable(v.string()),
};

export const addDosageForm = mutation({
	args: mutateDosageArgs,
	handler: async (ctx, args) => {
		const { description, name } = args;

		const userId = await getUserId(ctx);

		const dosageForm = await ctx.db.insert("dosage_forms", {
			name,
			description,
			addedBy: userId as Id<"users">,
			deletedBy: null,
			updatedBy: null,
			deletedAt: null,
			updatedAt: null,
		});

		return dosageForm;
	},
});

export const updateDosageForm = mutation({
	args: { ...mutateDosageArgs, dosageFormId: v.id("dosage_forms") },
	handler: async (ctx, args) => {
		const { description, dosageFormId, name } = args;
		const userId = await getUserId(ctx);

		return await ctx.db.patch("dosage_forms", dosageFormId, {
			name,
			description,
			updatedAt: new Date().toISOString(),
			updatedBy: userId,
			deletedAt: null,
			deletedBy: null,
		});
	},
});

export const deleteDosageForm = mutation({
	args: { id: v.id("dosage_forms") },
	handler: async (ctx, args) => {
		const deletedBy = await getUserId(ctx);
		await ctx.db.patch("dosage_forms", args.id, {
			deletedAt: new Date().toISOString(),
			deletedBy,
		});

		return args.id;
	},
});

export const listDosageForms = query({
	args: {},
	handler: async (ctx) => {
		const dosageForms = await ctx.db
			.query("dosage_forms")
			.withIndex("by_soft_delete", (q) => q.eq("deletedAt", null))
			.order("desc")
			// .filter((doc) => doc.neq(doc.field("deletedAt"), null))
			.collect();

		const dosageFormsWithUsers = await Promise.all(
			dosageForms.map(async (df) => {
				return {
					...df,
					addedBy: await getUserInfo(ctx, df.addedBy),
					updatedBy: await getUserInfo(ctx, df.updatedBy),
				};
			}),
		);

		return dosageFormsWithUsers;
	},
});

export async function getUserInfo(ctx: QueryCtx, userId: Id<"users"> | null) {
	if (userId === null) {
		return null;
	}

	const user = await ctx.db.get("users", userId);

	if (!user) {
		return null;
	}

	return {
		name: user.name,
		email: user.email,
		phone: user.phone,
		_id: user._id,
	};
}

export async function getUserId(ctx: MutationCtx) {
	const userId = await getAuthUserId(ctx);

	if (userId === null) {
		throw new Error("Unauthorized");
	}

	return userId;
}
