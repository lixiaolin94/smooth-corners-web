export function computeSmoothCorners(
	width: number,
	height: number,
	radius: number,
	smoothing: number,
): {
	radius: number;
	compensatedRadius: number;
	k: number | null;
	smoothing: number;
};
