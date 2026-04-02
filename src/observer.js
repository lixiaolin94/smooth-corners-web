/**
 * Smooth corners observer — declarative + programmatic API.
 *
 * Declarative:
 *   <div data-smooth-corners="40">
 *   <div data-smooth-corners="40" data-smooth-corners-smoothing="0.8">
 *
 * Programmatic:
 *   import { observe, unobserve } from 'smooth-corners/observer'
 *   observe(el, { radius: 40, smoothing: 0.8 })
 *   unobserve(el)
 *
 * Declarative auto-observe is opt-in:
 *   import 'smooth-corners/declarative'
 *   // or call startAutoObserve() manually
 */
import { computeSmoothCorners } from './compute.js';
import { smoothCornersCSS } from './css.js';

const DEFAULT_SMOOTHING = 0.6;
const HAS_DOM =
	typeof window !== 'undefined' &&
	typeof document !== 'undefined' &&
	typeof Element !== 'undefined';
const CAN_OBSERVE =
	HAS_DOM &&
	typeof ResizeObserver !== 'undefined' &&
	typeof MutationObserver !== 'undefined';
const STYLE_ID = 'smooth-corners-observer-style';

function ensureBaseStyles() {
	if (!HAS_DOM || document.getElementById(STYLE_ID)) return;
	const style = document.createElement('style');
	style.id = STYLE_ID;
	style.textContent = smoothCornersCSS;
	document.head.append(style);
}
const ATTR = 'data-smooth-corners';
const ATTR_S = 'data-smooth-corners-smoothing';

/** @type {Map<Element, { radius: number, smoothing: number, programmatic: boolean, addedClass: boolean }>} */
const tracked = new Map();
let autoRoot = null;
let mo = null;
const pending = new Set();
let rafId = 0;
const schedule = typeof requestAnimationFrame === 'function'
	? requestAnimationFrame
	: (fn) => setTimeout(fn, 0);

function flushPending() {
	rafId = 0;
	for (const el of pending) applyStyle(el);
	pending.clear();
}

function scheduleApply(el) {
	pending.add(el);
	if (!rafId) rafId = schedule(flushPending);
}

const ro = CAN_OBSERVE ? new ResizeObserver((entries) => {
	for (const entry of entries) {
		const box = entry.borderBoxSize?.[0];
		if (box) {
			applyStyle(entry.target, box.inlineSize, box.blockSize);
		} else {
			applyStyle(entry.target, entry.contentRect.width, entry.contentRect.height);
		}
	}
}) : null;

function readAttrs(el) {
	const raw = el.getAttribute(ATTR);
	if (raw === null) return null;
	const r = parseFloat(raw);
	const s = parseFloat(el.getAttribute(ATTR_S));
	return {
		radius: Number.isFinite(r) ? r : 0,
		smoothing: Number.isFinite(s) ? s : DEFAULT_SMOOTHING,
	};
}

function applyStyle(el, w, h) {
	const state = tracked.get(el);
	if (!state) return;

	let width = w, height = h;
	if (width === undefined || height === undefined) {
		const rect = el.getBoundingClientRect();
		width = rect.width;
		height = rect.height;
	}
	if (width === 0 || height === 0) return;

	const result = computeSmoothCorners(width, height, state.radius, state.smoothing);

	el.style.setProperty('--sc-r', `${result.radius}px`);
	if (result.k !== null) {
		el.style.setProperty('--sc-i', `${result.compensatedRadius}px`);
		el.style.setProperty('--sc-s', `superellipse(${result.k.toFixed(4)})`);
	} else {
		el.style.setProperty('--sc-i', `${result.radius}px`);
		el.style.setProperty('--sc-s', '');
	}
	if (!el.classList.contains('smooth-corners')) {
		el.classList.add('smooth-corners');
		state.addedClass = true;
	}
}

function clearStyle(el) {
	const state = tracked.get(el);
	el.style.removeProperty('--sc-r');
	el.style.removeProperty('--sc-i');
	el.style.removeProperty('--sc-s');
	if (state && state.addedClass) {
		el.classList.remove('smooth-corners');
	}
}

function startObserving(el, params) {
	const isNew = !tracked.has(el);
	if (isNew) ensureBaseStyles();
	const prev = tracked.get(el);
	tracked.set(el, { ...params, addedClass: prev ? prev.addedClass : false });
	if (isNew && ro) {
		ro.observe(el);
	} else {
		scheduleApply(el);
	}
}

function stopObserving(el) {
	if (!tracked.has(el)) return;
	pending.delete(el);
	clearStyle(el);
	tracked.delete(el);
	if (ro) ro.unobserve(el);
}

// --- Declarative: scan + watch DOM ---

function handleElement(el) {
	const state = tracked.get(el);
	if (state && state.programmatic) return;

	const params = readAttrs(el);
	if (params) {
		startObserving(el, { ...params, programmatic: false });
	} else if (state && !state.programmatic) {
		stopObserving(el);
	}
}

function scanSubtree(root) {
	if (!(root instanceof Element)) return;
	if (root.hasAttribute(ATTR)) handleElement(root);
	for (const el of root.querySelectorAll(`[${ATTR}]`)) handleElement(el);
}

function stopDeclarativeTracking() {
	for (const [el, state] of [...tracked.entries()]) {
		if (!state.programmatic) stopObserving(el);
	}
}

function createMutationObserver() {
	return new MutationObserver((mutations) => {
		for (const m of mutations) {
			if (m.type === 'attributes') {
				handleElement(m.target);
				continue;
			}
			for (const node of m.addedNodes) scanSubtree(node);
			for (const node of m.removedNodes) {
				if (!(node instanceof Element)) continue;
				if (tracked.has(node)) stopObserving(node);
				for (const el of node.querySelectorAll(`[${ATTR}]`)) {
					if (tracked.has(el)) stopObserving(el);
				}
			}
		}
	});
}

/** Start watching the DOM for [data-smooth-corners] elements. */
export function startAutoObserve(root = HAS_DOM ? document.documentElement : null) {
	if (!CAN_OBSERVE || !(root instanceof Element)) return false;
	if (mo && autoRoot === root) return true;
	if (mo) stopAutoObserve();

	autoRoot = root;
	mo = createMutationObserver();
	scanSubtree(root);
	mo.observe(root, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: [ATTR, ATTR_S],
	});

	return true;
}

/** Stop declarative DOM watching and clear styles applied by attribute-based tracking. */
export function stopAutoObserve() {
	if (mo) {
		mo.disconnect();
		mo = null;
	}
	autoRoot = null;
	stopDeclarativeTracking();
}

// --- Programmatic API ---

/** @param {Element} el @param {{ radius: number, smoothing?: number }} opts */
export function observe(el, opts) {
	if (!HAS_DOM || !(el instanceof Element)) return;
	startObserving(el, {
		radius: opts.radius,
		smoothing: opts.smoothing ?? DEFAULT_SMOOTHING,
		programmatic: true,
	});
}

/** @param {Element} el */
export function unobserve(el) {
	if (!HAS_DOM || !(el instanceof Element)) return;
	stopObserving(el);
}
