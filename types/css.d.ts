export function smoothCorners(
	radius: number,
	smoothing?: number,
): Record<string, string>;

export function applySmooth(
	el: HTMLElement,
	vars: Record<string, string>,
): void;

export const smoothCornersCSS: string;
