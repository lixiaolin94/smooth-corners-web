/**
 * Smooth corners CSS variable generator.
 *
 * Returns CSS custom properties to pair with the `.smooth-corners` class.
 *   <div class="smooth-corners" style={smoothCorners(16)}>
 *   <div class="smooth-corners" style={smoothCorners(16, 0.8)}>
 *
 * @param {number} radius - Corner radius in px
 * @param {number} [smoothing=0.6] - 0..1 (0.6 ≈ iOS)
 * @returns {Record<string, string>}
 */
import { superellipseK } from './core.js';

export function smoothCorners(radius, smoothing = 0.6) {
	if (!Number.isFinite(radius)) radius = 0;
	if (!Number.isFinite(smoothing)) smoothing = 0.6;
	if (radius < 1e-6) {
		return { '--sc-r': '0px', '--sc-i': '0px', '--sc-s': '' };
	}

	const s = Math.max(0, Math.min(1, smoothing));

	if (s < 1e-6) {
		const v = `${radius}px`;
		return { '--sc-r': v, '--sc-i': v, '--sc-s': '' };
	}

	const compensated = radius * (1 + s);
	const k = superellipseK(radius, compensated);

	if (k <= 1) {
		const v = `${radius}px`;
		return { '--sc-r': v, '--sc-i': v, '--sc-s': '' };
	}

	return {
		'--sc-r': `${radius}px`,
		'--sc-i': `${compensated}px`,
		'--sc-s': `superellipse(${k.toFixed(4)})`,
	};
}

/**
 * Apply CSS variables to an element via setProperty.
 * Needed in vanilla JS; React/Vue style bindings handle this automatically.
 *
 * @param {HTMLElement} el
 * @param {Record<string, string>} vars - Return value of smoothCorners()
 */
export function applySmooth(el, vars) {
	for (const [k, v] of Object.entries(vars)) {
		el.style.setProperty(k, v);
	}
}

/** CSS rules to include in your stylesheet (once). */
export const smoothCornersCSS = `
.smooth-corners {
  border-radius: var(--sc-r);
}
@supports (corner-shape: superellipse(2)) {
  .smooth-corners {
    border-radius: var(--sc-i);
    corner-shape: var(--sc-s);
  }
}`;
