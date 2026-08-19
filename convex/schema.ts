import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { customersTable } from "./schema.customers";
import { productsTable } from "./schema.products";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
	dosage_forms: defineTable({
		name: v.string(),
		description: v.nullable(v.string()),
		addedBy: v.nullable(v.string()),
		updatedBy: v.nullable(v.string()),
		updatedAt: v.nullable(v.string()),
		deletedBy: v.nullable(v.string()),
		deletedAt: v.nullable(v.string()),
	}).index("by_soft_delete", ["deletedAt"]),

	customers: customersTable,
	products: productsTable,
});
