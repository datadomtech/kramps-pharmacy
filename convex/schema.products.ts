import { defineTable } from "convex/server";
import { v } from "convex/values";

export const productFields = {
	name: v.string(),
	brandName: v.string(),
	genericName: v.nullable(v.string()),
	barCodeNumber: v.nullable(v.string()),
	dosageFormId: v.id("dosage_forms"),
	description: v.nullable(v.string()),
	imageUrl: v.optional(v.string()),
	manufacturer: v.nullable(v.string()),
	isActive: v.boolean(),
	addedAt: v.string(),
	addedBy: v.string(),
	deactivatedBy: v.nullable(v.string()),
	updatedBy: v.nullable(v.string()),
	updatedAt: v.nullable(v.string()),
	deletedBy: v.nullable(v.string()),
	deletedAt: v.nullable(v.string()),
};

export const productsTable = defineTable(productFields);
