import { Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";

import type { FulfillmentType, InventoryBatch, PaymentMethod } from "~/lib/types";
import { AlertCircleIcon, SearchIcon, XIcon } from "~/components/icons";
import { toastManager as toast } from "~selia/toast";
import { Button } from "~primitives/button";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useAddCustomer } from "~/hooks/use-customers";
import { useStaff } from "~/hooks/use-staff";
import { fetchProductBatches, useBlacklistStatus, useCreateSale, useCustomerBalance, useCustomerSearch, useProductSearch } from "~/hooks/use-pos";
import type { ProductSearchResult } from "~/server/pos";
import type { SaleReceipt } from "~/server/sales";

const EXPIRY_WARNING_DAYS = 30;

type CartLine = {
	key: string;
	productId: string;
	name: string;
	dosageFormName: string | null;
	unitPrice: number;
	quantity: number;
	batchId: string | null;
};

type PaymentDraft = {
	id: string;
	method: PaymentMethod;
	amount: number;
};

type CustomerPick = {
	id: string;
	name: string;
	phone: string | null;
	email: string | null;
	blacklisted: boolean;
};

const money = (value: number): string => value.toFixed(2);

const todayStart = (): Date => {
	const now = new Date();

	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const daysUntilExpiry = (expiryDate: string): number =>
	Math.round((new Date(`${expiryDate}T00:00:00`).getTime() - todayStart().getTime()) / 86_400_000);

const isExpiredBatch = (expiryDate: string | null): boolean => expiryDate !== null && daysUntilExpiry(expiryDate) < 0;

const sellableBatches = (batches: Array<InventoryBatch>): Array<InventoryBatch> => batches.filter((batch) => !isExpiredBatch(batch.expiryDate));

function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
	if (expiryDate === null) {
		return (
			<span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-500">
				no expiry
			</span>
		);
	}

	const days = daysUntilExpiry(expiryDate);
	const label = `exp ${format(new Date(`${expiryDate}T00:00:00`), "d MMM yyyy")}`;

	if (days < 0) {
		return (
			<span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
				expired · {label}
			</span>
		);
	}

	if (days <= EXPIRY_WARNING_DAYS) {
		return (
			<span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-[11px] font-medium text-yellow-700">
				{label} · {days}d left
			</span>
		);
	}

	return (
		<span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600">
			{label}
		</span>
	);
}

function useDebounced(value: string, delay = 200): string {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);

		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
}

export const PosRegister = () => {
	const queryClient = useQueryClient();
	const currentUser = useCurrentUser();
	const { data: staffData } = useStaff();
	const staffList = staffData ?? [];
	const addCustomer = useAddCustomer();
	const createSaleMutation = useCreateSale();

	const searchInputRef = useRef<HTMLInputElement>(null);
	const idempotencyKeyRef = useRef<string | null>(null);

	const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>("pickup");
	const [searchInput, setSearchInput] = useState("");
	const debouncedSearch = useDebounced(searchInput);
	const [cart, setCart] = useState<Array<CartLine>>([]);
	const [batchesByProduct, setBatchesByProduct] = useState<Record<string, Array<InventoryBatch>>>({});
	const [discountInput, setDiscountInput] = useState("0");
	const [customerQuery, setCustomerQuery] = useState("");
	const debouncedCustomerQuery = useDebounced(customerQuery);
	const [customer, setCustomer] = useState<CustomerPick | null>(null);
	const [courierId, setCourierId] = useState("");
	const [deliveryAddress, setDeliveryAddress] = useState("");
	const [payments, setPayments] = useState<Array<PaymentDraft>>([]);
	const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
	const [paymentAmountInput, setPaymentAmountInput] = useState("");
	const [creditAcknowledged, setCreditAcknowledged] = useState(false);
	const [blacklistOverride, setBlacklistOverride] = useState(false);
	const [quickCreateOpen, setQuickCreateOpen] = useState(false);
	const [quickName, setQuickName] = useState("");
	const [quickPhone, setQuickPhone] = useState("");
	const [receipt, setReceipt] = useState<SaleReceipt | null>(null);

	const { data: productResults } = useProductSearch(receipt === null ? debouncedSearch : "");
	const { data: customerResults } = useCustomerSearch(debouncedCustomerQuery);
	const blacklistStatus = useBlacklistStatus(customer?.id ?? null);
	const customerBalance = useCustomerBalance(customer?.id ?? null);

	useEffect(() => {
		searchInputRef.current?.focus();
	}, []);

	useEffect(() => {
		setBlacklistOverride(false);
	}, [customer?.id]);

	const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [cart]);
	const discount = Math.min(Math.max(Number(discountInput) || 0, 0), subtotal);
	const total = subtotal - discount;
	const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
	const remaining = Math.max(total - paid, 0);
	const needsCreditAck = remaining > 0.005;

	const customerRequired = fulfillmentType === "delivery" || needsCreditAck;
	const blacklisted = blacklistStatus.data?.blacklisted === true;
	const outstandingBalance = customerBalance.data?.outstandingBalance ?? 0;
	const outOfStockLines = cart.filter((line) => {
		const batch = (batchesByProduct[line.productId] ?? []).find((candidate) => candidate.id === line.batchId);

		return batch !== undefined && line.quantity > batch.quantityOnHand;
	});

	const canSubmit =
		cart.length > 0 &&
		outOfStockLines.length === 0 &&
		(!blacklisted || blacklistOverride) &&
		(!needsCreditAck || creditAcknowledged) &&
		(!customerRequired || customer !== null) &&
		(fulfillmentType !== "delivery" || deliveryAddress.trim() !== "");

	const resetRegister = () => {
		setCart([]);
		setBatchesByProduct({});
		setDiscountInput("0");
		setPayments([]);
		setPaymentAmountInput("");
		setCreditAcknowledged(false);
		setFulfillmentType("pickup");
		setDeliveryAddress("");
		setCourierId("");
		selectCustomer(null);
		setCustomerQuery("");
		setQuickCreateOpen(false);
		idempotencyKeyRef.current = null;
		searchInputRef.current?.focus();
	};

	const selectCustomer = (pick: CustomerPick | null) => {
		setCustomer(pick);
		setCustomerQuery("");
	};

	const addToCart = async (result: ProductSearchResult) => {
		const price = result.price;

		if (price === null) {
			toast.add({ title: `${result.name} has no price set`, description: "Set a price on the product first.", type: "error", timeout: 8000 });
			return;
		}

		let batches: Array<InventoryBatch>;

		try {
			batches = await fetchProductBatches(queryClient, result.id);
		} catch {
			toast.add({ title: "Could not load stock batches", type: "error" });
			return;
		}

		const open = sellableBatches(batches);

		if (open.length === 0) {
			toast.add({ title: `${result.name} has no sellable stock`, description: "All open batches are expired.", type: "error", timeout: 8000 });
			return;
		}

		const fefo = open[0];

		if (fefo.expiryDate !== null && daysUntilExpiry(fefo.expiryDate) <= EXPIRY_WARNING_DAYS) {
			toast.add({
				title: `${result.name} expires ${format(new Date(`${fefo.expiryDate}T00:00:00`), "d MMM yyyy")}`,
				description: "Selling from a batch within 30 days of expiry.",
				type: "warning",
				timeout: 8000,
			});
		}

		setBatchesByProduct((current) => ({ ...current, [result.id]: batches }));

		const lineKey = `${result.id}:${fefo.id}`;

		setCart((current) => {
			const existing = current.find((line) => line.key === lineKey);

			if (existing !== undefined) {
				return current.map((line) => (line.key === lineKey ? { ...line, quantity: Math.min(line.quantity + 1, fefo.quantityOnHand) } : line));
			}

			return [
				...current,
				{
					key: lineKey,
					productId: result.id,
					name: result.name,
					dosageFormName: result.dosageFormName,
					unitPrice: price,
					quantity: Math.min(1, fefo.quantityOnHand),
					batchId: fefo.id,
				},
			];
		});
	};

	const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key !== "Enter") {
			return;
		}

		const term = searchInput.trim();
		const results = productResults ?? [];

		const exactBarcode = results.find((result) => result.barCodeNumber !== null && result.barCodeNumber.toLowerCase() === term.toLowerCase());

		if (exactBarcode !== undefined) {
			void addToCart(exactBarcode);
			return;
		}

		if (results.length === 1) {
			void addToCart(results[0]);
		}
	};

	const updateLineQuantity = (key: string, quantity: number) => {
		setCart((current) =>
			current.map((line) => {
				if (line.key !== key) {
					return line;
				}

				const batch = (batchesByProduct[line.productId] ?? []).find((candidate) => candidate.id === line.batchId);
				const max = batch?.quantityOnHand ?? quantity;

				return { ...line, quantity: Math.max(1, Math.min(quantity, max)) };
			}),
		);
	};

	const updateLineBatch = (key: string, batchId: string) => {
		setCart((current) => current.map((line) => (line.key === key ? { ...line, key: `${line.productId}:${batchId}`, batchId } : line)));
	};

	const addPaymentSplit = () => {
		const amount = Number(paymentAmountInput);

		if (Number.isNaN(amount) || amount <= 0) {
			toast.add({ title: "Enter a payment amount first", type: "warning", timeout: 5000 });
			return;
		}

		const capped = Math.min(amount, remaining);

		if (capped <= 0.005) {
			toast.add({ title: "Nothing left to pay", type: "info", timeout: 5000 });
			return;
		}

		setPayments((current) => [...current, { id: crypto.randomUUID(), method: paymentMethod, amount: capped }]);
		setPaymentAmountInput(money(Math.max(remaining - capped, 0)));
	};

	const submitSale = async () => {
		if (idempotencyKeyRef.current === null) {
			idempotencyKeyRef.current = crypto.randomUUID();
		}

		try {
			const created = await createSaleMutation.mutateAsync({
				idempotencyKey: idempotencyKeyRef.current,
				customerId: customer?.id ?? null,
				fulfillmentType,
				courierId: fulfillmentType === "delivery" && courierId !== "" ? courierId : null,
				deliveryAddress: fulfillmentType === "delivery" ? deliveryAddress.trim() : null,
				discount,
				allowExpiredBatch: false,
				blacklistOverride,
				creditAcknowledged: needsCreditAck,
				items: cart.map((line) => ({ productId: line.productId, quantity: line.quantity, inventoryBatchId: line.batchId })),
				payments: payments.map((payment) => ({ method: payment.method, amountPaid: payment.amount })),
			});

			idempotencyKeyRef.current = null;
			setReceipt(created);
		} catch (error) {
			toast.add({
				title: error instanceof Error ? error.message : "Checkout failed — nothing was charged.",
				type: "error",
				timeout: 10_000,
			});
		}
	};

	const quickCreateCustomer = async () => {
		if (quickName.trim() === "") {
			toast.add({ title: "Customer needs at least a name", type: "warning", timeout: 5000 });
			return;
		}

		try {
			const createdId = await addCustomer.mutateAsync({
				name: quickName.trim(),
				phone: quickPhone.trim() === "" ? null : quickPhone.trim(),
				address: null,
				email: null,
				contactName: null,
				contactPhone: null,
				contactEmail: null,
				type: "individual",
			});

			selectCustomer({
				id: createdId,
				name: quickName.trim(),
				phone: quickPhone.trim() === "" ? null : quickPhone.trim(),
				email: null,
				blacklisted: false,
			});
			setQuickName("");
			setQuickPhone("");
			setQuickCreateOpen(false);
			toast.add({ title: "Customer created", type: "success", timeout: 4000 });
		} catch (error) {
			toast.add({ title: error instanceof Error ? error.message : "Could not create customer", type: "error", timeout: 8000 });
		}
	};

	if (currentUser.isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<TopBar
				fulfillmentType={fulfillmentType}
				onFulfillmentChange={(next) => {
					setFulfillmentType(next);
					if (next === "pickup") {
						setDeliveryAddress("");
						setCourierId("");
					}
				}}
				staffName={currentUser.user.name ?? currentUser.user.email ?? "You"}
			/>

			<div className="flex flex-col items-start gap-4 lg:flex-row">
				<div className="flex min-w-0 flex-1 flex-col gap-4">
					<section className="card p-0!">
						<header className="border-b border-solid border-gray-200 px-5 py-3">
							<h2 className="text-dialog-header font-medium text-emerald-900">Products</h2>
						</header>
						<div className="relative px-5 py-3">
							<SearchIcon className="pointer-events-none absolute top-1/2 left-8 size-5 -translate-y-1/2 fill-white stroke-gray-400 stroke-[1.5px]" />
							<input
								ref={searchInputRef}
								type="search"
								placeholder="Scan barcode or search name…"
								autoFocus={true}
								value={searchInput}
								onChange={(event) => setSearchInput(event.target.value)}
								onKeyDown={handleSearchKeyDown}
								className="input-text pl-10!"
							/>
						</div>
						{productResults !== undefined && productResults.length > 0 && (
							<ul className="divide-y divide-solid divide-gray-100 border-t border-solid border-gray-200">
								{productResults.map((result) => (
									<li key={result.id}>
										<button
											type="button"
											onClick={() => void addToCart(result)}
											className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-2.5 text-left hover:bg-gray-50"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium text-emerald-700 capitalize">{result.name}</p>
												<p className="text-xs text-gray-500">
													{result.dosageFormName?.toLocaleLowerCase("en-GB") ?? "—"} · GHS {money(result.price ?? 0)} ·{" "}
													{result.stockAvailable} units
												</p>
											</div>
											<ExpiryBadge expiryDate={result.soonestExpiryDate} />
										</button>
									</li>
								))}
							</ul>
						)}
						<p className="border-t border-solid border-gray-100 px-5 py-2 text-xs text-gray-400">
							Type to search · Enter adds an exact match
						</p>
					</section>

					<section className="card p-0!">
						<header className="flex items-center justify-between border-b border-solid border-gray-200 px-5 py-3">
							<h2 className="text-dialog-header font-medium text-emerald-900">Customer</h2>
							<span className="text-xs text-gray-500">{customerRequired ? "required" : "optional for pickup + cash"}</span>
						</header>

						{customer === null ? (
							<div className="space-y-3 px-5 py-3">
								<div className="flex flex-wrap items-center gap-2">
									<input
										type="search"
										placeholder="Search name or phone…"
										value={customerQuery}
										onChange={(event) => setCustomerQuery(event.target.value)}
										className="input-text sm:max-w-xs"
									/>
									<button
										type="button"
										onClick={() => setQuickCreateOpen(true)}
										className="btn btn-secondary btn-sm whitespace-nowrap"
									>
										+ New customer
									</button>
								</div>

								{customerResults !== undefined && customerResults.length > 0 && (
									<ul className="divide-y divide-solid divide-gray-100 rounded-lg border border-solid border-gray-200">
										{customerResults.map((result) => (
											<li key={result.id}>
												<button
													type="button"
													onClick={() => selectCustomer(result)}
													className="flex w-full cursor-pointer items-center justify-between gap-4 px-3 py-2 text-left hover:bg-gray-50"
												>
													<span className="truncate text-sm font-medium text-emerald-700 capitalize">{result.name}</span>
													<span className="text-xs text-gray-500">
														{result.phone ?? "no phone"}
														{result.blacklisted ? " · blacklisted" : ""}
													</span>
												</button>
											</li>
										))}
									</ul>
								)}

								{!quickCreateOpen ? null : (
									<div className="flex flex-wrap items-end gap-2 rounded-lg border border-solid border-gray-200 p-3">
										<label className="block grow space-y-1">
											<span className="text-xs text-gray-500">Name</span>
											<input
												type="text"
												value={quickName}
												onChange={(event) => setQuickName(event.target.value)}
												className="input-text"
											/>
										</label>
										<label className="block space-y-1">
											<span className="text-xs text-gray-500">Phone</span>
											<input
												type="text"
												value={quickPhone}
												onChange={(event) => setQuickPhone(event.target.value)}
												className="input-text"
											/>
										</label>
										<Button
											type="button"
											onClick={() => void quickCreateCustomer()}
											disabled={addCustomer.isPending}
											className="btn btn-primary btn-sm"
										>
											Save
										</Button>
										<button
											type="button"
											aria-label="Cancel"
											onClick={() => setQuickCreateOpen(false)}
											className="cursor-pointer p-1 text-gray-400 hover:text-gray-700"
										>
											<XIcon />
										</button>
									</div>
								)}

								{customerRequired && <p className="text-sm text-yellow-700">A customer is required for this sale.</p>}
							</div>
						) : (
							<div className="space-y-2 px-5 py-3">
								<div className="flex items-center justify-between gap-4">
									<div>
										<p className="text-sm font-medium text-emerald-900 capitalize">{customer.name}</p>
										<p className="text-xs text-gray-500">{customer.phone ?? "no phone on file"}</p>
									</div>
									<div className="flex items-center gap-3">
										{(customerBalance.data?.outstandingBalance ?? 0) > 0.005 && (
											<span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
												owes GHS {money(outstandingBalance)}
											</span>
										)}
										<Link to="/customers" className="text-sm text-btn hover:text-emerald-600">
											change
										</Link>
										<button
											type="button"
											aria-label="Clear customer"
											onClick={() => selectCustomer(null)}
											className="cursor-pointer p-1 text-gray-400 hover:text-gray-700"
										>
											<XIcon />
										</button>
									</div>
								</div>

								{blacklisted && (
									<div className="card-error flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl p-3 text-sm">
										<AlertCircleIcon className="size-5 shrink-0 fill-red-700 stroke-transparent" />
										<span className="grow">
											This customer is blacklisted
											{blacklistStatus.data?.reason !== null && blacklistStatus.data !== undefined
												? ` — ${blacklistStatus.data.reason}`
												: ""}
											. Checkout is blocked.
										</span>
										<label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-red-700">
											<input
												type="checkbox"
												checked={blacklistOverride}
												onChange={(event) => setBlacklistOverride(event.target.checked)}
											/>
											Override &amp; continue
										</label>
									</div>
								)}
							</div>
						)}
					</section>

					{fulfillmentType === "delivery" && (
						<section className="card p-0!">
							<header className="border-b border-solid border-gray-200 px-5 py-3">
								<h2 className="text-dialog-header font-medium text-emerald-900">Delivery</h2>
							</header>
							<div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-2">
								<label className="block space-y-1">
									<span className="text-sm font-medium text-emerald-900">Delivery address</span>
									<input
										type="text"
										placeholder="Street, area, landmark"
										value={deliveryAddress}
										onChange={(event) => setDeliveryAddress(event.target.value)}
										className="input-text"
									/>
								</label>
								<label className="block space-y-1">
									<span className="text-sm font-medium text-emerald-900">Courier</span>
									<select
										value={courierId}
										onChange={(event) => setCourierId(event.target.value)}
										className="input-select w-full rounded-lg"
									>
										<option value="">Unassigned</option>
										{staffList.map((member) => (
											<option key={member.id} value={member.id}>
												{member.fullName ?? member.email ?? member.id}
											</option>
										))}
									</select>
								</label>
							</div>
						</section>
					)}
				</div>

				<div className="flex w-full flex-col gap-4 lg:w-105 lg:shrink-0">
					{receipt === null ? (
						<>
							<section className="card p-0!">
								<header className="flex items-center justify-between border-b border-solid border-gray-200 px-5 py-3">
									<h2 className="text-dialog-header font-medium text-emerald-900">Cart</h2>
									<span className="text-xs text-gray-500">
										{cart.length} line{cart.length === 1 ? "" : "s"}
									</span>
								</header>

								{cart.length === 0 ? (
									<p className="px-5 py-6 text-center text-sm text-gray-400">Cart is empty — scan or search to add.</p>
								) : (
									<table className="w-full text-sm">
										<thead>
											<tr className="border-b border-solid border-gray-200 text-left text-xs text-gray-500">
												<th className="px-5 py-2 font-normal">Product</th>
												<th className="px-2 py-2 font-normal">Batch / Exp</th>
												<th className="px-2 py-2 text-right font-normal">Qty</th>
												<th className="px-5 py-2 text-right font-normal">GHS</th>
												<th className="w-6" />
											</tr>
										</thead>
										<tbody className="divide-y divide-solid divide-gray-100">
											{cart.map((line) => {
												const batches = sellableBatches(batchesByProduct[line.productId] ?? []);
												const batch = batches.find((candidate) => candidate.id === line.batchId);
												const overStock = batch !== undefined && line.quantity > batch.quantityOnHand;

												return (
													<tr key={line.key} className="hover:bg-gray-50">
														<td className="max-w-32 truncate px-5 py-2">
															<span className="block truncate font-medium text-emerald-700 capitalize">
																{line.name}
															</span>
															<span className="block font-mono text-xs text-gray-500">{money(line.unitPrice)}</span>
														</td>
														<td className="px-2 py-2">
															<select
																value={line.batchId ?? ""}
																onChange={(event) => updateLineBatch(line.key, event.target.value)}
																className="input-select mb-1 w-28 rounded-md text-xs"
																aria-label={`Batch for ${line.name}`}
															>
																{batches.map((candidate) => (
																	<option key={candidate.id} value={candidate.id}>
																		{candidate.batchNumber ?? candidate.id.slice(0, 8)} (
																		{candidate.quantityOnHand})
																	</option>
																))}
															</select>
															<ExpiryBadge expiryDate={batch?.expiryDate ?? null} />
															{overStock && (
																<span className="mt-1 block text-[11px] font-medium text-red-600">
																	exceeds batch stock
																</span>
															)}
														</td>
														<td className="px-2 py-2 text-right">
															<input
																type="number"
																min={1}
																step={1}
																value={line.quantity}
																onChange={(event) =>
																	updateLineQuantity(
																		line.key,
																		Number.isNaN(event.target.valueAsNumber)
																			? 1
																			: Math.max(1, Math.trunc(event.target.valueAsNumber)),
																	)
																}
																className={`w-16 rounded-md border border-solid px-1 py-0.5 text-right font-mono ${
																	overStock ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200"
																}`}
																aria-label={`Quantity for ${line.name}`}
															/>
														</td>
														<td className="px-5 py-2 text-right font-mono">{money(line.unitPrice * line.quantity)}</td>
														<td className="pr-3">
															<button
																type="button"
																aria-label={`Remove ${line.name}`}
																onClick={() => setCart((current) => current.filter((row) => row.key !== line.key))}
																className="cursor-pointer p-1 text-gray-400 hover:text-red-600"
															>
																<XIcon />
															</button>
														</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								)}

								<dl className="space-y-1 border-t border-solid border-gray-200 px-5 py-3 text-sm">
									<div className="flex items-center justify-between text-gray-600">
										<dt>Subtotal</dt>
										<dd className="font-mono">{money(subtotal)}</dd>
									</div>
									<div className="flex items-center justify-between gap-2 text-gray-600">
										<dt>Discount (GHS)</dt>
										<dd>
											<input
												type="number"
												min={0}
												step="0.01"
												value={discountInput}
												onChange={(event) => setDiscountInput(event.target.value)}
												className="w-24 rounded-md border border-solid border-gray-200 px-1 py-0.5 text-right font-mono"
												aria-label="Discount amount"
											/>
										</dd>
									</div>
									<div className="flex justify-between border-t border-solid border-gray-200 pt-1 text-base font-semibold text-emerald-900">
										<dt>Total</dt>
										<dd className="font-mono">{money(total)}</dd>
									</div>
								</dl>
							</section>

							<section className="card p-0!">
								<header className="border-b border-solid border-gray-200 px-5 py-3">
									<h2 className="text-dialog-header font-medium text-emerald-900">Payment</h2>
								</header>
								<div className="space-y-3 px-5 py-4">
									<div className="flex items-center gap-2">
										{(["cash", "momo", "credit"] as const).map((method) => (
											<button
												key={method}
												type="button"
												onClick={() => setPaymentMethod(method)}
												className={`${paymentMethod === method ? "btn btn-primary" : "btn btn-secondary"} btn-sm grow capitalize`}
											>
												{method === "momo" ? "MoMo" : method}
											</button>
										))}
									</div>

									<div className="flex items-end gap-2">
										<label className="block grow space-y-1">
											<span className="text-xs text-gray-500">Amount (GHS)</span>
											<input
												type="number"
												min={0}
												step="0.01"
												placeholder={money(remaining)}
												value={paymentAmountInput}
												onChange={(event) => setPaymentAmountInput(event.target.value)}
												className="input-text font-mono"
											/>
										</label>
										<button type="button" onClick={addPaymentSplit} className="btn btn-secondary btn-sm whitespace-nowrap">
											Add split
										</button>
									</div>

									{payments.length === 0 ? null : (
										<ul className="divide-y divide-solid divide-gray-100 rounded-lg border border-solid border-gray-200 text-sm">
											{payments.map((payment) => (
												<li key={payment.id} className="flex items-center justify-between px-3 py-2">
													<span className="capitalize">{payment.method === "momo" ? "MoMo" : payment.method}</span>
													<span className="flex items-center gap-2">
														<span className="font-mono">{money(payment.amount)}</span>
														<button
															type="button"
															aria-label="Remove payment"
															onClick={() => setPayments((current) => current.filter((row) => row.id !== payment.id))}
															className="cursor-pointer p-0.5 text-gray-400 hover:text-red-600"
														>
															<XIcon />
														</button>
													</span>
												</li>
											))}
										</ul>
									)}

									<div className="flex items-center justify-between text-sm">
										<span className="text-gray-600">Remaining balance</span>
										<span className={`font-mono font-semibold ${needsCreditAck ? "text-yellow-700" : "text-emerald-900"}`}>
											{money(remaining)}
										</span>
									</div>

									{needsCreditAck && (
										<label className="flex items-start gap-2 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-800">
											<input
												type="checkbox"
												checked={creditAcknowledged}
												onChange={(event) => setCreditAcknowledged(event.target.checked)}
												className="mt-0.5"
											/>
											<span>
												Leave GHS {money(remaining)} as credit{customer === null ? " — select a customer to bill first" : ""}
											</span>
										</label>
									)}

									<Button
										type="button"
										onClick={() => void submitSale()}
										disabled={!canSubmit || createSaleMutation.isPending}
										className="btn btn-primary w-full"
									>
										{createSaleMutation.isPending ? "Completing…" : "Complete Sale"}
									</Button>
								</div>
							</section>
						</>
					) : (
						<section className="card card-success p-0! print:border-0">
							<header className="flex items-center justify-between border-b border-solid border-gray-200 px-5 py-3">
								<h2 className="text-dialog-header font-medium text-emerald-900">Sale complete</h2>
								<span className="font-mono text-xs text-gray-500">#{receipt.sale.id.slice(0, 8)}</span>
							</header>
							<div className="space-y-1 px-5 py-3 text-sm">
								<p className="text-gray-600">
									{format(new Date(receipt.sale.createdAt), "d MMM yyyy, HH:mm")} ·{" "}
									{receipt.sale.fulfillmentType === "delivery" ? "Delivery" : "Pickup"} · {receipt.sale.staffName ?? "Staff"}
								</p>
								{receipt.sale.customerId !== null && <p className="text-gray-600 capitalize">Customer: {customer?.name ?? "—"}</p>}
								<table className="mt-2 w-full text-sm">
									<tbody className="divide-y divide-solid divide-gray-100">
										{receipt.items.map((item) => (
											<tr key={item.id}>
												<td className="py-1.5 pr-2 capitalize">{item.productName ?? item.productId}</td>
												<td className="py-1.5 pr-2 text-right font-mono">×{item.quantity}</td>
												<td className="py-1.5 text-right font-mono">{money(item.lineTotal)}</td>
											</tr>
										))}
									</tbody>
								</table>
								<dl className="mt-2 space-y-1 border-t border-solid border-gray-200 pt-2">
									<div className="flex justify-between text-gray-600">
										<dt>Subtotal</dt>
										<dd className="font-mono">{money(receipt.sale.subtotal)}</dd>
									</div>
									<div className="flex justify-between text-gray-600">
										<dt>Discount</dt>
										<dd className="font-mono">{money(receipt.sale.discount)}</dd>
									</div>
									{receipt.payments.map((payment) => (
										<div key={payment.id} className="flex justify-between text-gray-600">
											<dt className="capitalize">
												{payment.method === "momo" ? "MoMo" : payment.method}
												{payment.reference !== null ? ` (${payment.reference})` : ""}
											</dt>
											<dd className="font-mono">{money(payment.amountPaid)}</dd>
										</div>
									))}
									{receipt.payments.some((payment) => payment.amountDue > 0) && (
										<div className="flex justify-between font-medium text-yellow-700">
											<dt>Credit due</dt>
											<dd className="font-mono">
												{money(receipt.payments.find((payment) => payment.amountDue > 0)?.amountDue ?? 0)}
											</dd>
										</div>
									)}
									<div className="flex justify-between border-t border-solid border-gray-200 pt-1 text-base font-semibold text-emerald-900">
										<dt>Total</dt>
										<dd className="font-mono">{money(receipt.sale.total)}</dd>
									</div>
								</dl>
							</div>
							<div className="flex gap-2 border-t border-solid border-gray-200 px-5 py-3 print:hidden">
								<button type="button" onClick={() => window.print()} className="btn btn-secondary btn-sm grow">
									Print
								</button>
								<button
									type="button"
									onClick={() => {
										setReceipt(null);
										resetRegister();
									}}
									className="btn btn-primary btn-sm grow"
								>
									New Sale
								</button>
							</div>
						</section>
					)}
				</div>
			</div>
		</div>
	);
};

const TopBar = ({
	fulfillmentType,
	onFulfillmentChange,
	staffName,
}: {
	fulfillmentType: FulfillmentType;
	onFulfillmentChange: (next: FulfillmentType) => void;
	staffName: string;
}) => (
	<div className="card flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-3">
		<div className="flex items-center gap-2">
			<span className="text-sm text-gray-500">Fulfilment</span>
			<button
				type="button"
				onClick={() => onFulfillmentChange("pickup")}
				className={fulfillmentType === "pickup" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
			>
				Pickup
			</button>
			<button
				type="button"
				onClick={() => onFulfillmentChange("delivery")}
				className={fulfillmentType === "delivery" ? "btn btn-primary btn-sm" : "btn btn-secondary btn-sm"}
			>
				Delivery
			</button>
		</div>
		<div className="flex items-center gap-2 text-sm text-gray-500">
			<span>Staff</span>
			<span className="font-medium text-emerald-900">{staffName}</span>
		</div>
	</div>
);
