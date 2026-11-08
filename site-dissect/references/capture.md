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

Runs in the page, returns JSON:

```js
(() => {
  const cs = (el) => el ? getComputedStyle(el) : null;
  const pick = (el) => {
    if (!el) return null;
    const s = cs(el);
    const r = el.getBoundingClientRect();
    return {
      font: s.fontFamily.split(',')[0].replace(/['"]/g, ''),
      size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing,
      color: s.color, bg: s.backgroundColor, radius: s.borderRadius,
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const q = (sel) => document.querySelector(sel);
  const secs = [...document.querySelectorAll('section')].slice(0, 8).map((s) => {
    const st = cs(s);
    return { pad: st.paddingTop + '/' + st.paddingBottom, bg: st.backgroundColor };
  });
  return JSON.stringify({
    title: document.title,
    h1: pick(q('h1')), h2: pick(q('h2')), p: pick(q('main p, article p, p')),
    btn: pick(q('button, .button, [class*=button], [class*=cta], a[class*=btn]')),
    hero: pick(q('h1') ? q('h1').closest('section, header, div') : null),
    wrap: pick(q('main, [class*=container], [class*=wrap]')),
    bodyBg: cs(document.body).backgroundColor,
    bodyFont: cs(document.body).fontFamily.split(',')[0].replace(/['"]/g, ''),
    docH: document.body.scrollHeight,
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
- `bodyBg` / `secs[].bg` — surface palette and section alternation.
- `secs[].pad` — section rhythm range.
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

A before/after `ui-council` run needs rung 1; without it, defer the council
to build time and record that in the direction doc's open items.

## The project's own site

The source is the truth the probe only confirms: read the tokens from code as
well as probing the page, and record any drift between the declared brand
(the app theme or token files) and what the web surface actually renders —
drift is a `change` item with evidence.
