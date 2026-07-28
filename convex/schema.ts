import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { customersTable } from "./schema.customers";
import { productsTable } from "./schema.products";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
	...authTables,

	dosage_forms: defineTable({
		name: v.string(),
		description: v.nullable(v.string()),
		addedBy: v.nullable(v.id("users")),
		updatedBy: v.nullable(v.id("users")),
		updatedAt: v.nullable(v.string()),
		deletedBy: v.nullable(v.id("users")),
		deletedAt: v.nullable(v.string()),
	}).index("by_soft_delete", ["deletedAt"]),

	customers: customersTable,
	products: productsTable,
});
