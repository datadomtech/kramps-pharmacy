export type UserInfo = {
	id: string;
	name: string;
	email: string | null;
	phone: string | null;
};

export type CustomerType = "individual" | "hospital" | "pharmacy";

export type DosageForm = {
	id: string;
	createdAt: string;
	name: string;
	description: string | null;
	addedBy: UserInfo | null;
	updatedBy: UserInfo | null;
	updatedAt: string | null;
	deletedAt: string | null;
};

export type Product = {
	id: string;
	createdAt: string;
	name: string;
	brandName: string;
	genericName: string | null;
	barCodeNumber: string | null;
	dosageFormId: string;
	dosageForm: { id: string; name: string; description: string | null } | null;
	description: string | null;
	imageUrl: string | null;
	manufacturer: string | null;
	isActive: boolean;
	addedAt: string;
	addedBy: UserInfo | null;
	deactivatedBy: string | null;
	updatedBy: UserInfo | null;
	updatedAt: string | null;
	deletedBy: string | null;
	deletedAt: string | null;
};

export type Customer = {
	id: string;
	createdAt: string;
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	type: CustomerType;
	blacklistedAt: string | null;
	blacklistedBy: string | null;
	blacklistedReason: string | null;
	addedBy: UserInfo | null;
	updatedBy: UserInfo | null;
	updatedAt: string | null;
	deletedAt: string | null;
	deletedBy: string | null;
};

export type SessionUser = {
	id: string;
	email: string | null;
	name: string | null;
	phone: string | null;
};
