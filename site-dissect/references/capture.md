# Capturing measured tokens

Computed styles are the evidence: real font sizes, weights, tracking, hex
colors and page lengths, not eyeballed approximations. Screenshots complement
them for composition; they never replace them for values.

## The loop

- **One browser tab, reused.** Open the first URL once; for every site after
  that, navigate the same tab. Cheaper, and every site is measured under the
  same conditions.
- **Desktop viewport first:** resize the tab to 1440 × 900 before probing.
  For the project's own site, also run a mobile pass at 390 × 844.
- **Let the page settle** before probing: webfont swaps and late layout shift
  both change computed values. Probe after load has finished, and prefer a
  tool that waits for network idle.
- **Pass the probe as an expression string** when the evaluation tool accepts
  both a function and an expression; on some stacks the function form is
  rejected. If the tool only takes functions, wrap the same body.
- Save each site's raw JSON to scratch. The direction doc gets the distilled
  table; scratch keeps the receipts.

## The probe

Runs in the page, returns JSON. Selector lists are tried in list order —
a combined selector would return the first match in document order, which on
a real site is the cookie bar. Page chrome (headers, navs, footers, dialogs)
is skipped, and a nav's own CTA with it, on purpose: the body repeats the
primary CTA on most sites. Button matching sticks to anchors and buttons, so
a wrapper whose class merely contains `cta` or `button` never wins, and the
h1 gets a second, chrome-allowed pass because masthead-pattern heroes keep
their h1 inside the header.

```js
(() => {
  // First match for a selector list, in list order. Visible means at least
  // 8px, so screen-reader-only text at 1x1 is skipped. A selector *list
  // inside one string* matches in document order instead — that is why each
  // selector is tried separately here.
  const q = (selectors, allowChrome) => {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8
            && (allowChrome || !el.closest('header, nav, footer, dialog'))) {
          return el;
        }
      }
    }
    return null;
  };
  // Computed colors arrive as rgb(), rgba() or oklch(); drawing to a 1x1
  // canvas normalizes them all to hex, keeping the alpha as a suffix when
  // the color is translucent. Fully transparent returns null, and bgOf then
  // walks to the nearest ancestor that paints something.
  const ctx = document.createElement('canvas').getContext('2d');
  const hexOf = (color) => {
    if (!color || color === 'transparent') return null;
    ctx.clearRect(0, 0, 1, 1); // a translucent fill composites over the last
    ctx.fillStyle = '#000';    // pixel otherwise, returning a stale color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    if (d[3] === 0) return null;
    const hex = (n) => n.toString(16).padStart(2, '0');
    return '#' + hex(d[0]) + hex(d[1]) + hex(d[2]) + (d[3] < 255 ? hex(d[3]) : '');
  };
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const h = hexOf(getComputedStyle(e).backgroundColor);
      if (h) return h;
    }
    return null;
  };
  const pick = (el) => {
    if (!el) return null;
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      font: s.fontFamily.split(',')[0].replace(/['"]/g, ''),
      size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing,
      color: hexOf(s.color), bg: bgOf(el), radius: s.borderRadius,
      caps: s.textTransform, bgImage: s.backgroundImage !== 'none',
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const h1 = q(['h1']) || q(['h1'], true); // masthead heroes: h1 in the header
  // The hero block: the first ancestor at or near the viewport's width,
  // starting above the h1 so a container-width h1 is not itself mistaken
  // for the hero.
  let hero = null;
  if (h1) {
    hero = h1.parentElement;
    while (hero && hero !== document.body) {
      if (hero.getBoundingClientRect().width >= window.innerWidth * 0.95) break;
      hero = hero.parentElement;
    }
    if (hero === document.body) hero = null;
  }
  // The content container: the widest binding max-width outside chrome.
  // Non-binding values (such as 100%) resolve to the viewport or more,
  // images and chips resolve small — the container lands between.
  let wrap = null, wrapMax = 0;
  for (const el of document.querySelectorAll('main, div, section')) {
    if (el.closest('header, nav, footer, dialog')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const mw = parseFloat(getComputedStyle(el).maxWidth);
    if (!isFinite(mw) || mw >= window.innerWidth || mw < 480) continue;
    if (mw > wrapMax) { wrapMax = mw; wrap = el; }
  }
  const cand = [...document.querySelectorAll('section, main > div')]
    .filter((s) => !s.closest('header, nav, footer, dialog'))
    .filter((s, i, arr) => !arr.some((o) => o !== s && o.contains(s)));
  const secs = cand.slice(0, 8).map((s) => {
    const st = getComputedStyle(s);
    return { pad: st.paddingTop + '/' + st.paddingBottom, bg: bgOf(s) };
  });
  return JSON.stringify({
    title: document.title,
    h1: pick(h1), h2: pick(q(['h2'])), p: pick(q(['main p', 'article p', 'p'])),
    btn: pick(q(['a[class*=cta]', 'button[class*=cta]', 'a[class*=btn]',
                 'a[class*=button]', 'button', '[role=button]'])),
    hero: pick(hero),
    wrap: pick(wrap),
    bodyBg: bgOf(document.body),
    bodyFont: getComputedStyle(document.body).fontFamily.split(',')[0].replace(/['"]/g, ''),
    docH: document.documentElement.scrollHeight,
    secs
  });
})()
```

First match of each kind is enough for a design read; the point is
comparability across sites, not exhaustive scraping.

## What each field feeds

- `h1` / `h2` / `p` — display and body type: families, scale, weights,
  tracking. Three sites sharing a family is a convention; one alone is a
  choice. `p` is the lede or first body paragraph: on sites whose hero sits
  inside `main`, it is the hero lede — compare like with like.
- `btn` — CTA treatment: size, weight, radius, color on bg.
- `caps` / `bgImage` — slop confirmation without screenshots: all-caps
  tracked labels, and gradient or image backdrops.
- `bodyBg` / `secs[].bg` — surface palette and section alternation, as hex;
  an alpha suffix (as in `#ffffff0a`) marks a translucent layer over whatever
  sits behind it. `null` means nothing paints there; the browser default
  shows through.
- `secs[].pad` — section rhythm range. Padding that reads `0/0` usually sits
  on an inner wrapper — note it rather than chasing it.
- `docH` — page length: how much argument the site makes. A baseline a
  fraction of the references' length is itself a finding. Sites with
  transform-based smooth scrolling can report the viewport height instead —
  when `docH` equals the viewport exactly, cross-check before trusting it.
- `hero` / `wrap` — hero proportions and the content container's width.

## Screenshots — the visuals ladder

Work down as tools allow, and say in the doc which rung the run landed on:

1. **Capture available:** alongside the probe, take a fold shot (the viewport
   only) and a full-page shot per site at 1440 × 900, mobile for the project's
   own site. These carry composition, imagery and hierarchy — everything the
   probe cannot express.
2. **No capture, but a live tab:** computed styles only. Label every verdict
   "no visual capture"; composition claims become named gaps.
3. **No browser at all:** fetched text only. Say so up front; the dissection
   is then structural, and visual directions wait for a capture path.

A before/after `ui-council` run needs rung 1.

## The project's own site

The source is the truth the probe only confirms: read the tokens from code as
well as probing the page, and record any drift between the declared brand
(the app theme or token files) and what the web surface actually renders —
drift is a `change` item with evidence.
