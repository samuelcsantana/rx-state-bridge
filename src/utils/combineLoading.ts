/**
 * Combines multiple independent loading booleans into a single "is anything
 * loading" flag — e.g. a dashboard driving several unrelated `withLoading`
 * indicators that should collapse into one spinner.
 *
 * This is a plain synchronous helper, not an RxJS operator: `StateIndicator`
 * is write-only, so there is nothing to subscribe to here. Call it directly
 * inside your own reactive computation — a React render body, an Angular
 * `computed()`, a Vue `computed()` — so it naturally re-evaluates whenever
 * any of the underlying values changes.
 *
 * @param values - The individual loading flags to combine.
 * @returns `true` if any value is `true`.
 *
 * @example React
 * ```ts
 * const [usersLoading, setUsersLoading] = useState(false);
 * const [ordersLoading, setOrdersLoading] = useState(false);
 *
 * const isAnythingLoading = combineLoading(usersLoading, ordersLoading);
 * ```
 *
 * @example Angular
 * ```ts
 * usersLoading = signal(false);
 * ordersLoading = signal(false);
 *
 * readonly isAnythingLoading = computed(() =>
 *   combineLoading(this.usersLoading(), this.ordersLoading()),
 * );
 * ```
 */
export function combineLoading(...values: boolean[]): boolean {
  return values.some(Boolean);
}
