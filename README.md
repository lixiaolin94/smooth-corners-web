# smooth-corners

Figma/iOS-style corner smoothing for CSS. Converts `corner radius + smoothing` into `border-radius + corner-shape: superellipse(K)`.

- Zero dependencies, tiny footprint
- Progressive enhancement — falls back to plain `border-radius` when `corner-shape` is unsupported
- Three API layers: CSS variables, dimension-aware compute, DOM observer

## Install

```bash
npm i @lixiaolin94/smooth-corners
```

## Usage

### CSS Variables (recommended)

`smoothCorners(radius, smoothing?)` returns CSS custom properties to pair with the `.smooth-corners` class. `smoothing` defaults to `0.6` (Figma's 60% Corner Smoothing).

Add the following rules to your global stylesheet (also available as `smoothCornersCSS` export):

```css
.smooth-corners {
  border-radius: var(--sc-r);
}
@supports (corner-shape: superellipse(2)) {
  .smooth-corners {
    border-radius: var(--sc-i);
    corner-shape: var(--sc-s);
  }
}
```

React:

```jsx
import { smoothCorners } from '@lixiaolin94/smooth-corners';

<div className="smooth-corners" style={smoothCorners(30)} />
```

Vue:

```vue
import { smoothCorners } from '@lixiaolin94/smooth-corners';

<div class="smooth-corners" :style="smoothCorners(30)" />
```

Vanilla JS:

```js
import { applySmooth, smoothCorners } from '@lixiaolin94/smooth-corners';

applySmooth(element, smoothCorners(30));
```

Returns `--sc-r` (original radius), `--sc-i` (compensated radius), `--sc-s` (`superellipse(K)` value).

### Dimension-Aware Compute

When you know the element's size, use `computeSmoothCorners` for accurate results — it clamps radius and smoothing to available space automatically.

```js
import { computeSmoothCorners } from '@lixiaolin94/smooth-corners';

const result = computeSmoothCorners(180, 120, 30, 0.6);
// {
//   radius: 30,             — target corner radius
//   compensatedRadius: ..., — compensated radius for superellipse
//   k: ...,                 — superellipse exponent (null = no smoothing)
//   smoothing: ...,         — effective smoothing (may be reduced by space)
// }
```

### DOM Observer

The observer automatically injects the `.smooth-corners` base styles on first use — no extra setup needed.

Declarative — add attributes and import the auto-observer:

```html
<div data-smooth-corners="30"></div>

<script type="module">
  import '@lixiaolin94/smooth-corners/declarative';
</script>
```

Programmatic — observe individual elements:

```js
import { observe, unobserve } from '@lixiaolin94/smooth-corners/observer';

observe(element, { radius: 30, smoothing: 0.6 });
unobserve(element);
```

## Exports

| Subpath | Description |
| --- | --- |
| `@lixiaolin94/smooth-corners` | CSS variable API + dimension-aware compute |
| `@lixiaolin94/smooth-corners/css` | CSS variable API only |
| `@lixiaolin94/smooth-corners/compute` | Dimension-aware pure compute |
| `@lixiaolin94/smooth-corners/observer` | DOM observer (import has no side effects; auto-injects base styles on first use) |
| `@lixiaolin94/smooth-corners/declarative` | Side-effect import — starts auto-observe |

## Browser Support

Uses `corner-shape: superellipse(...)` when supported (Chrome 138+). Falls back to standard `border-radius` in all other browsers — corners remain but without the smooth transition. All APIs use CSS `@supports` for automatic switching.

## License

Apache-2.0
