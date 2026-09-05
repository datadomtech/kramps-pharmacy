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

export type Supplier = {
	id: string;
	createdAt: string;
	name: string;
	phone: string | null;
	address: string | null;
	email: string | null;
	contactName: string | null;
	contactPhone: string | null;
	contactEmail: string | null;
	addedBy: UserInfo | null;
	updatedBy: UserInfo | null;
	updatedAt: string | null;
	deletedBy: UserInfo | null;
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
	strength: string | null;
	strengthUnit: string | null;
	isActive: boolean;
	price: number | null;
	stockAvailable: number;
	soonestExpiryDate: string | null;
	addedAt: string;
	addedBy: UserInfo | null;
	deactivatedBy: UserInfo | null;
	updatedBy: UserInfo | null;
	updatedAt: string | null;
	deletedBy: UserInfo | null;
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

export type Location = {
	id: string;
	createdAt: string;
	name: string;
	description: string | null;
	addedBy: UserInfo | null;
	deletedAt: string | null;
};

export type WarehouseMovementType = "in" | "out" | "move";

export type WarehouseMovement = {
	id: string;
	type: WarehouseMovementType;
	productId: string;
	productName: string;
	quantity: number;
	occurredAt: string;
	staffName: string | null;
	batchNumber: string | null;
	expiryDate: string | null;
	supplierName: string | null;
	saleStatus: SaleStatus | null;
	fromLocationName: string | null;
	toLocationName: string | null;
	note: string | null;
	batchId: string | null;
};

export type FulfillmentType = "pickup" | "delivery";

export type SaleStatus = "pending" | "completed" | "cancelled" | "refunded";

export type PaymentMethod = "cash" | "momo" | "credit";

export type InventoryBatch = {
	id: string;
	createdAt: string;
	productId: string;
	batchNumber: string | null;
	quantityOnHand: number;
	expiryDate: string | null;
	receivedAt: string;
	supplierId: string | null;
	costPrice: number | null;
};

export type Sale = {
	id: string;
	createdAt: string;
	customerId: string | null;
	staffId: string;
	staffName?: string | null;
	fulfillmentType: FulfillmentType;
	courierId: string | null;
	courierName?: string | null;
	deliveryAddress: string | null;
	status: SaleStatus;
	subtotal: number;
	discount: number;
	total: number;
};

export type SaleItem = {
	id: string;
	saleId: string;
	productId: string;
	inventoryBatchId: string | null;
	dosageFormId: string | null;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
};

export type Payment = {
	id: string;
	saleId: string;
	method: PaymentMethod;
	amountPaid: number;
	amountDue: number;
	receivedBy: string;
	reference: string | null;
	paidAt: string;
};
