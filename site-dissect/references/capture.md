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
a real site is the cookie bar — and page chrome (headers, navs, footers,
dialogs) is skipped. A nav's own CTA is skipped with it, on purpose: the body
repeats the primary CTA on most sites.

```js
(() => {
  // First visible match for a selector list, in list order, outside page
  // chrome. A selector *list inside one string* matches in document order
  // instead — that is why each selector is tried separately here.
  const q = (selectors) => {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && !el.closest('header, nav, footer, dialog')) {
          return el;
        }
      }
    }
    return null;
  };
  // Computed colors arrive as rgb(), rgba() or oklch(); drawing to a 1x1
  // canvas normalizes them all to hex. Fully transparent returns null, and
  // bgOf then walks to the nearest ancestor that paints something.
  const ctx = document.createElement('canvas').getContext('2d');
  const hexOf = (color) => {
    if (!color || color === 'transparent') return null;
    ctx.clearRect(0, 0, 1, 1); // a transparent fill composites over the last
    ctx.fillStyle = '#000';    // pixel otherwise, returning a stale color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return d[3] === 0 ? null
      : '#' + [d[0], d[1], d[2]].map((n) => n.toString(16).padStart(2, '0')).join('');
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
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const h1 = q(['h1']);
  // The hero block: the h1's own section or header; when the hero is built
  // from divs, the first ancestor at or near the viewport's width.
  let hero = h1 ? h1.closest('section, header') : null;
  if (h1 && !hero) {
    hero = h1;
    while (hero.parentElement && hero.parentElement !== document.body) {
      if (hero.getBoundingClientRect().width >= window.innerWidth * 0.8) break;
      hero = hero.parentElement;
    }
  }
  const secs = [...document.querySelectorAll('section, main > div')].slice(0, 8).map((s) => {
    const st = getComputedStyle(s);
    return { pad: st.paddingTop + '/' + st.paddingBottom, bg: bgOf(s) };
  });
  return JSON.stringify({
    title: document.title,
    h1: pick(h1), h2: pick(q(['h2'])), p: pick(q(['main p', 'article p', 'p'])),
    btn: pick(q(['[class*=cta]', 'a[class*=btn]', '[class*=button]', 'button', '[role=button]'])),
    hero: pick(hero),
    wrap: pick(q(['main', '[class*=container]', '[class*=wrap]'])),
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
  choice.
- `btn` — CTA treatment: size, weight, radius, color on bg.
- `bodyBg` / `secs[].bg` — surface palette and section alternation, as hex.
  `null` means nothing paints there; the browser default shows through.
- `secs[].pad` — section rhythm range. Padding that reads `0/0` usually sits
  on an inner wrapper — note it rather than chasing it.
- `docH` — page length: how much argument the site makes. A baseline a
  fraction of the references' length is itself a finding.
- `hero` / `wrap` — hero proportions and container discipline.

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
