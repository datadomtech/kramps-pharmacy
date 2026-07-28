import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getUserId, getUserInfo } from "./dosageForms";
import { productFields } from "./schema.products";

const { addedAt, addedBy, isActive, updatedAt, updatedBy, deletedAt, deletedBy, deactivatedBy, ...createFields } = productFields;

const mutateProductArgs = createFields;

export const addProduct = mutation({
	args: mutateProductArgs,
	handler: async (ctx, args) => {
		const { description, name, barCodeNumber, brandName, dosageFormId, genericName, manufacturer, imageUrl } = args;

		const userId = await getUserId(ctx);

		const product = await ctx.db.insert("products", {
			name,
			description,
			addedBy: userId as Id<"users">,
			addedAt: new Date().toISOString(),
			barCodeNumber,
			brandName,
			deactivatedBy: null,
			deletedAt: null,
			deletedBy: null,
			updatedAt: null,
			updatedBy: null,
			dosageFormId,
			genericName,
			isActive: true,
			manufacturer,
			imageUrl,
		});

		return product;
	},
});

export const updateProduct = mutation({
	args: { ...mutateProductArgs, productId: v.id("products") },
	handler: async (ctx, args) => {
		const { productId, description, name, barCodeNumber, brandName, dosageFormId, genericName, manufacturer, imageUrl } = args;

		const userId = await getUserId(ctx);

		return await ctx.db.patch("products", productId, {
			name,
			description,
			barCodeNumber,
			brandName,
			dosageFormId,
			genericName,
			manufacturer,
			imageUrl,
			updatedAt: new Date().toISOString(),
			updatedBy: userId,
			deletedAt: null,
			deletedBy: null,
		});
	},
});

export const deleteProduct = mutation({
	args: { id: v.id("products") },
	handler: async (ctx, args) => {
		const deletedBy = await getUserId(ctx);
		await ctx.db.patch("products", args.id, {
			deletedAt: new Date().toISOString(),
			deletedBy,
		});

		return args.id;
	},
});

export const listProducts = query({
	args: {},
	handler: async (ctx) => {
		const products = await ctx.db
			.query("products")
			// .withIndex("by_soft_delete", (q) => q.eq("deletedAt", null))
			.order("desc")
			// .filter((doc) => doc.neq(doc.field("deletedAt"), null))
			.collect();

		const productsWithUsers = await Promise.all(
			products.map(async (pd) => {
				return {
					...pd,
					addedBy: await getUserInfo(ctx, pd.addedBy),
					updatedBy: await getUserInfo(ctx, pd.updatedBy),
				};
			}),
		);

		return productsWithUsers;
	},
});
