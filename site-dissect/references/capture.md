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
- **Scroll back to the top before probing.** The CTA rule measures element
  positions from the current scroll: a page probed after a scroll-to-bottom
  pass (lazy loading, stitched screenshots) yields a different CTA.
- **Pass the probe as an expression string** when the evaluation tool accepts
  both a function and an expression; on some stacks the function form is
  rejected. If the tool only takes functions, wrap the same body.
- Save each site's raw JSON to scratch. The direction doc gets the distilled
  table; scratch keeps the receipts.
- **Verify the probe against real sites when you change it.** Pages built to
  reproduce a known failure encode the author's assumptions and pass; live
  sites across stacks (a utility-class site, a hashed-class site, a site
  builder's export, something hand-built) are the test that counts.

## The probe

Runs in the page, returns JSON. Selector lists are tried in list order —
a combined selector would return the first match in document order, which on
a real site is the cookie bar. Page chrome — headers, navs, footers, dialogs,
including cookie consent built as a `div[role=dialog]` — is skipped. Only
the h1 and CTA searches reach into the chrome element that holds the h1, so
a masthead hero still yields its heading and its CTA; everything else —
`h2`, `p`, `wrap`, `secs` — measures body content only. The CTA is found
anchored on the h1 and by how it looks, not by class names or document
order: announcement pills and navbars sit above the h1, utility-class and
hashed-class sites never carry `cta`/`btn`/`button` in their classes, and
DOM order is not visual order. Every picked element carries its `tag` and
first words of `text`, so a misread is visible in the JSON instead of
poisoning the table.

```js
(() => {
  const CHROME = 'header, nav, footer, dialog, [role=dialog], [aria-modal=true]';
  // First match for a selector list, in list order. Visible means at least
  // 8px, so screen-reader-only text at 1x1 is skipped. A selector *list
  // inside one string* matches in document order instead — that is why each
  // selector is tried separately here.
  const q = (selectors, allowChrome) => {
    for (const sel of selectors) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width >= 8 && r.height >= 8
            && (allowChrome || !el.closest(CHROME))) {
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
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40),
      font: s.fontFamily.split(',')[0].replace(/['"]/g, ''),
      size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing,
      color: hexOf(s.color), bg: bgOf(el), radius: s.borderRadius,
      caps: s.textTransform, bgImage: s.backgroundImage !== 'none',
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const h1 = q(['h1']) || q(['h1'], true); // masthead heroes: h1 in the header
  // The CTA: the nearest painted, button-sized element at or below the h1,
  // not the first one in the document — announcement pills sit above the
  // h1, navbars above that, and DOM order is not visual order. The h1's own
  // chrome ancestor is exempt, so masthead heroes (CTA beside the h1 in the
  // header) still count; fixed-position widgets and anything parked
  // off-screen above or beside the viewport stay out. Candidates within 8px
  // of the best top count as one row; the first in DOM order wins it.
  const h1Chrome = h1 && h1.closest(CHROME);
  const h1Top = h1 ? h1.getBoundingClientRect().top : -Infinity;
  let btn = null, bestTop = Infinity;
  for (const el of document.querySelectorAll('a, button, [role=button]')) {
    const c = el.closest(CHROME);
    if (c && c !== h1Chrome) continue;
    const s = getComputedStyle(el);
    if (s.position === 'fixed') continue;
    const r = el.getBoundingClientRect();
    if (r.top < h1Top - 1 || r.bottom <= 0 || r.right <= 0
        || r.left >= window.innerWidth) continue;
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (!text || text.length > 40) continue;
    if (r.height < 32 || r.height > 96) continue;
    if (r.width < 40 || r.width > window.innerWidth * 0.5) continue;
    if (!hexOf(s.backgroundColor) && s.backgroundImage === 'none') continue;
    if (r.top < bestTop - 8) { bestTop = r.top; btn = el; }
  }
  // The hero block: the first ancestor at or near the viewport's width that
  // is not taller than about 1.5 viewports (a whole-page wrapper is),
  // starting above the h1 so a container-width h1 is not itself mistaken
  // for the hero.
  let hero = null;
  if (h1) {
    let prev = null, el = h1.parentElement;
    while (el && el !== document.body) {
      const r = el.getBoundingClientRect();
      if (r.height > window.innerHeight * 1.5) break;
      prev = el;
      if (r.width >= window.innerWidth * 0.95) { hero = el; break; }
      el = el.parentElement;
    }
    hero = hero || prev || h1;
  }
  // The content container: the widest max-width outside chrome that is
  // actually binding — the rendered width has reached the cap. Non-binding
  // values (such as 100%) resolve to the viewport or more, small widgets
  // sit inside their cap without touching it; the container does touch it.
  let wrap = null, wrapMax = 0;
  for (const el of document.querySelectorAll('main, div, section')) {
    if (el.closest(CHROME)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) continue;
    const mw = parseFloat(getComputedStyle(el).maxWidth);
    if (!isFinite(mw) || mw >= window.innerWidth || mw < 480) continue;
    if (r.width < mw - 1) continue;
    if (mw > wrapMax) { wrapMax = mw; wrap = el; }
  }
  // Guard: a wrap at or near the viewport's width is a page shell wearing
  // a max-width just under the viewport (full-bleed in practice), and one
  // far narrower than the hero is a text column inside it, not the
  // container. Either way the container is unmeasured, not misread.
  if (wrap) {
    const wr = wrap.getBoundingClientRect();
    if (wr.width >= window.innerWidth * 0.95
        || (hero && wr.width < hero.getBoundingClientRect().width * 0.5)) {
      wrap = null;
    }
  }
  // Sections first; main > div only when the page has almost no <section>.
  // The outermost of nested sections wins, so wrappers do not swallow rows.
  let secsEls = [...document.querySelectorAll('section')]
    .filter((s) => !s.closest(CHROME));
  if (secsEls.length < 2) {
    secsEls = [...document.querySelectorAll('main > div')]
      .filter((s) => !s.closest(CHROME));
  }
  secsEls = secsEls.filter((s, i, arr) => !arr.some((o) => o !== s && o.contains(s)));
  const secs = secsEls.slice(0, 8).map((s) => {
    const st = getComputedStyle(s);
    return { pad: st.paddingTop + '/' + st.paddingBottom, bg: bgOf(s) };
  });
  return JSON.stringify({
    title: document.title,
    h1: pick(h1), h2: pick(q(['h2'])), p: pick(q(['main p', 'article p', 'p'])),
    btn: pick(btn),
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
  inside `main`, it is the hero lede — compare like with like. On masthead
  heroes the lede lives in the header and is skipped with the rest of the
  chrome, so `p` picks a later paragraph.
- `btn` — CTA treatment: size, weight, radius, color on bg. Chosen as the
  nearest painted, button-sized element at or below the h1 — check `tag` and
  `text` before trusting the row. A product-demo tab or a menu can sit
  between the h1 and the real CTA and win the row; on a page with no h1 the
  anchor is the top of the page and the rule is weaker. When `tag` and
  `text` are plainly not the CTA, note the misread instead of trusting it.
  On the mobile pass the half-width cap rejects full-width CTAs, so `btn`
  can misread or return null — trust the project's own code over the
  mobile pick.
- `caps` / `bgImage` — slop confirmation without screenshots: all-caps
  tracked labels, and gradient or image backdrops. They can confirm a
  suspect, never clear one — eyebrow labels and blurred blobs usually live
  on other elements; clearing takes a screenshot.
- `bodyBg` / `secs[].bg` — surface palette and section alternation, as hex;
  an alpha suffix (as in `#ffffff0a`) marks a translucent layer over whatever
  sits behind it. `null` means nothing paints there; the browser default
  shows through.
- `secs[].pad` — section rhythm range. On roughly a quarter of real sites
  every row reads `0/0` — the padding sits on an inner wrapper, and the
  rhythm is a named gap. An empty `secs` means the page exposes neither
  `section` nor `main > div`; the rhythm is unmeasured either way. Note it
  rather than chasing it.
- `docH` — page length: how much argument the site makes. A baseline a
  fraction of the references' length is itself a finding. Sites with
  transform-based smooth scrolling can report the viewport height instead —
  when `docH` equals the viewport exactly, cross-check before trusting it.
- `hero` / `wrap` — hero proportions and the content container's width. A
  `wrap` null after the guard (page shell or text column) means unmeasured,
  not absent. On the mobile pass, `wrap` is always null by construction —
  the filter needs a desktop viewport; do not read it as no container.

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
