/**
 * Dimension-aware smooth corners calculator.
 * Clamps extension to available space, gradually reducing smoothing to 0.
 *
 * @param {number} width
 * @param {number} height
 * @param {number} radius - Corner radius (px)
 * @param {number} smoothing - 0..1 (0.6 ≈ iOS)
 * @returns {{ radius: number, compensatedRadius: number, k: number|null, smoothing: number }}
 */
import { superellipseK } from './core.js';

export function computeSmoothCorners(width, height, radius, smoothing) {
	if (!Number.isFinite(width)) width = 0;
	if (!Number.isFinite(height)) height = 0;
	if (!Number.isFinite(radius)) radius = 0;
	if (!Number.isFinite(smoothing)) smoothing = 0;
	const s = Math.max(0, Math.min(1, smoothing));
	const limit = Math.min(width, height) / 2;
	const r = Math.min(Math.max(0, radius), limit);

	if (s < 1e-6 || r < 1e-6) {
		return { radius: r, compensatedRadius: r, k: null, smoothing: 0 };
	}

	const extension = Math.min(r * s, limit - r);

	if (extension < 1e-6) {
		return { radius: r, compensatedRadius: r, k: null, smoothing: 0 };
	}

	const compensated = r + extension;

	return {
		radius: r,
		compensatedRadius: compensated,
		k: superellipseK(r, compensated),
		smoothing: extension / r,
	};
}
