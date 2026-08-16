import { SearchIcon } from "./icons";
import { Input } from "~input";

export const Inventory = () => (
	<main className="card min-w-0 p-0 lg:flex-1">
		<form
			data-phx-id="m47-phx-GL4tQPiMwwLzbRdh"
			method="post"
			id="apps_filters"
			className="contents"
			phx-change="update_filters"
			phx-submit="update_filters"
		>
			<header className="border-b px-4 py-4">
				<div className="flex flex-wrap items-stretch justify-between gap-4">
					<div className="flex flex-col">
						<h1 className="text-2xl font-semibold text-emerald-900">Inventory</h1>
						<div className="mt-auto flex items-center gap-2">
							<span className="flex items-center gap-1.5 text-sm text-emerald-600">
								<span className="inline-flex items-center rounded-md bg-emerald-100 px-2 text-xs font-medium text-emerald-800">
									1
								</span>
								products
							</span>
						</div>
					</div>

					<div className="flex flex-col items-end gap-4">
						<div className="w-full sm:w-[320px]">
							<label htmlFor="search" className="sr-only">
								Search
							</label>
							<div className="relative w-full">
								<div className="pointer-events-none absolute inset-y-0 left-0 ml-3 flex items-center">
									<SearchIcon className="size-5 fill-white stroke-gray-400 stroke-[1.5px]" />
								</div>
								<Input
									className="block w-full rounded-lg border-gray-300 pr-8 pl-10! focus:border-green-500 focus:ring-green-500 sm:text-sm"
									data-slash-to-focus=""
									id="apps_filters_name"
									name="apps_search[name]"
									phx-debounce="200"
									placeholder="Search products..."
									type="text"
								/>
								<div className="pointer-events-none absolute inset-y-0 right-0 hidden items-center pr-3 sm:flex">
									<kbd className="inline-flex items-center rounded border border-gray-200 px-1.5 font-sans text-xs text-gray-400">
										/
									</kbd>
								</div>
							</div>
						</div>

						<div>
							<div className="flex items-center">
								<input type="hidden" name="apps_search[statuses][]" value="" />

								<div className="flex items-center gap-2">
									<div className="relative hidden cursor-pointer md:inline-flex">
										<Input
											id="statuses-deployed"
											name="apps_search[statuses][]"
											value="deployed"
											checked={true}
											type="checkbox"
											className="peer pointer-events-none sr-only"
										/>
										<div
											phx-click="toggle_status"
											phx-value-status="deployed"
											className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-all hover:bg-green-100"
										>
											<span
												data-phx-id="m49-phx-GL4tQPiMwwLzbRdh"
												className="hero-check-circle h-3.5 w-3.5 text-green-700"
											></span>
											<span>Expired</span>
											<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 text-[10px] font-semibold text-green-700">
												0
											</span>

											<svg className="h-3.5 w-3.5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
													clipRule="evenodd"
												></path>
											</svg>
										</div>
									</div>

									<div className="relative hidden cursor-pointer md:inline-flex">
										<Input
											id="statuses-pending"
											name="apps_search[statuses][]"
											value="pending"
											checked={false}
											type="checkbox"
											className="peer pointer-events-none sr-only"
										/>
										<div
											phx-click="toggle_status"
											phx-value-status="pending"
											className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 transition-all hover:bg-yellow-100"
										>
											<span data-phx-id="m50-phx-GL4tQPiMwwLzbRdh" className="hero-clock h-3.5 w-3.5 text-yellow-700"></span>
											<span>Out of stock</span>
											<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 text-[10px] font-semibold text-yellow-700">
												0
											</span>

											<svg className="h-3.5 w-3.5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
													clipRule="evenodd"
												></path>
											</svg>
										</div>
									</div>

									<div className="relative hidden cursor-pointer md:inline-flex">
										<Input
											id="statuses-suspended"
											name="apps_search[statuses][]"
											value="suspended"
											checked={false}
											type="checkbox"
											className="peer pointer-events-none sr-only"
										/>
										<div
											phx-click="toggle_status"
											phx-value-status="suspended"
											className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 transition-all hover:bg-gray-100"
										>
											<span
												data-phx-id="m51-phx-GL4tQPiMwwLzbRdh"
												className="hero-pause-circle h-3.5 w-3.5 text-gray-700"
											></span>
											<span>Suspended</span>
											<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 text-[10px] font-semibold text-gray-700">
												1
											</span>

											<svg className="h-3.5 w-3.5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
												<path
													fillRule="evenodd"
													d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
													clipRule="evenodd"
												></path>
											</svg>
										</div>
									</div>
								</div>
							</div>

							<div className="flex flex-wrap items-center gap-2">
								<div className="relative inline-flex cursor-pointer md:hidden">
									<Input
										id="statuses-mobile-deployed"
										name="apps_search[statuses][]"
										value="deployed"
										checked={true}
										type="checkbox"
										className="peer pointer-events-none sr-only"
									/>
									<div
										phx-click="toggle_status"
										phx-value-status="deployed"
										className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-all hover:bg-green-100"
									>
										<span data-phx-id="m52-phx-GL4tQPiMwwLzbRdh" className="hero-check-circle h-3.5 w-3.5 text-green-700"></span>
										<span>Deployed</span>
										<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 px-1 text-[10px] font-semibold text-green-700">
											0
										</span>

										<svg className="h-3.5 w-3.5 text-green-700" viewBox="0 0 20 20" fill="currentColor">
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
								</div>

								<div className="relative inline-flex cursor-pointer md:hidden">
									<Input
										id="statuses-mobile-pending"
										name="apps_search[statuses][]"
										value="pending"
										checked={false}
										type="checkbox"
										className="peer pointer-events-none sr-only"
									/>
									<div
										phx-click="toggle_status"
										phx-value-status="pending"
										className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 transition-all hover:bg-yellow-100"
									>
										<span data-phx-id="m53-phx-GL4tQPiMwwLzbRdh" className="hero-clock h-3.5 w-3.5 text-yellow-700"></span>
										<span>Pending</span>
										<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 px-1 text-[10px] font-semibold text-yellow-700">
											0
										</span>

										<svg className="h-3.5 w-3.5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
								</div>

								<div className="relative inline-flex cursor-pointer md:hidden">
									<Input
										id="statuses-mobile-suspended"
										name="apps_search[statuses][]"
										value="suspended"
										checked={false}
										type="checkbox"
										className="peer pointer-events-none sr-only"
									/>
									<div
										phx-click="toggle_status"
										phx-value-status="suspended"
										className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 transition-all hover:bg-gray-100"
									>
										<span data-phx-id="m54-phx-GL4tQPiMwwLzbRdh" className="hero-pause-circle h-3.5 w-3.5 text-gray-700"></span>
										<span>Suspended</span>
										<span className="inline-flex h-4 min-w-4.5 items-center justify-center rounded-full bg-white/60 px-1 text-[10px] font-semibold text-gray-700">
											1
										</span>

										<svg className="h-3.5 w-3.5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
											<path
												fillRule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
												clipRule="evenodd"
											></path>
										</svg>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</header>
		</form>

		<ul role="list" className="relative z-0">
			<div id="apps-list" phx-update="stream" className="">
				<li
					id="apps-7596872"
					className="relative border-b border-gray-200 py-2 pr-6 pl-4 hover:bg-gray-50 sm:py-2 sm:pl-6 lg:pl-8 xl:pl-6"
					role="region"
					aria-label="dotrace"
					data-phx-stream="0"
				>
					<div className="flex items-center justify-between gap-6">
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-3">
								<span
									data-phx-id="m77-phx-GL4tQPiMwwLzbRdh"
									className="mr-1 inline-block rounded-full border-4 border-white/75 bg-slate-400 p-1 align-text-top"
								></span>

								<div className="flex min-h-10 flex-col justify-center gap-0.5">
									<h2 className="flex items-center gap-2 text-sm font-medium">
										<a
											data-phx-id="m78-phx-GL4tQPiMwwLzbRdh"
											href="/apps/dotrace"
											data-phx-link="redirect"
											data-phx-link-state="push"
											className="flex items-center gap-2"
										>
											<span className="absolute inset-0" aria-hidden="true"></span>
											<span>Ibuprofen</span>
										</a>
									</h2>
									<div data-phx-id="m79-phx-GL4tQPiMwwLzbRdh" className="flex items-center gap-2.5 text-xs text-gray-500">
										<span className="inline-flex items-center gap-1">
											<span data-phx-id="m80-phx-GL4tQPiMwwLzbRdh" className="hero-cpu-chip h-3 w-3"></span>2 items
										</span>

										<span className="inline-flex items-center gap-1">
											<span data-phx-id="m81-phx-GL4tQPiMwwLzbRdh" className="hero-globe-alt h-3 w-3"></span>
											LHR
										</span>
									</div>
								</div>
							</div>
						</div>
						<div className="sm:hidden">
							<svg
								className="size-5 text-gray-400"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fillRule="evenodd"
									d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						</div>

						<div className="hidden shrink-0 flex-col items-end justify-center sm:flex"></div>
					</div>
				</li>
			</div>

			<nav className="flex items-center justify-between px-4 py-3 sm:px-6" aria-label="Pagination">
				<div className="flex flex-1 items-baseline justify-center gap-2">
					<p className="text-sm text-gray-700">
						<span>Displaying</span>
						<span className="font-medium">1</span>
						<span>out of</span>
						<span className="font-medium">1</span>
						<span>total.</span>
					</p>
				</div>
			</nav>
		</ul>
	</main>
);
