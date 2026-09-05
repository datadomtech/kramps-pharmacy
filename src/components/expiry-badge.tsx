import { format } from "date-fns";

export const EXPIRY_WARNING_DAYS = 30;

const todayStart = (): Date => {
	const now = new Date();

	return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

export const daysUntilExpiry = (expiryDate: string): number =>
	Math.round((new Date(`${expiryDate}T00:00:00`).getTime() - todayStart().getTime()) / 86_400_000);

export const isExpiredBatch = (expiryDate: string | null): boolean => expiryDate !== null && daysUntilExpiry(expiryDate) < 0;

export function ExpiryBadge({ expiryDate }: { expiryDate: string | null }) {
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
