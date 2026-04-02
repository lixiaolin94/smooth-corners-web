/**
 * Superellipse exponent K for CSS corner-shape.
 * Closed-form: 2·u^n = 1 → n = ln2 / ln(1/u), K = log₂(n)
 *
 * @param {number} radius - Original corner radius
 * @param {number} compensated - Compensated (expanded) radius
 * @returns {number}
 */
const D = 1 - Math.SQRT1_2; // 1 - 1/√2 ≈ 0.29289

export function superellipseK(radius, compensated) {
	if (radius <= 0 || compensated <= radius) return 1;
	const u = 1 - (radius * D) / compensated;
	if (u <= 0 || u >= 1) return 1;
	const n = Math.log(2) / Math.log(1 / u);
	return Math.log2(Math.max(2, n));
}
