export function startAutoObserve(root?: Element): boolean;
export function stopAutoObserve(): void;

export function observe(
	el: Element,
	opts: { radius: number; smoothing?: number },
): void;
export function unobserve(el: Element): void;
