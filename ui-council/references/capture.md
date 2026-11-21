# Capturing states

## Every platform

- Use one device, window size or viewport for all the shots. Before
  changing anything, note its settings (text size, appearance, network) and
  restore them at the end.
- Name shots `<n>-<screen>-<state>.png`. Keep the originals in a scratch
  folder. Give the raters a copy in a new folder with a random name, so the
  path reveals nothing. Copy only the PNGs: trees, measurements and overlays
  stay in the scratch folder, and raters never see them.
- Note the capture's pixel density, pixels per layout unit, for the
  [measurement pre-pass](measure.md). If the capture tool also gives element
  rects for free, save them as `<n>-<screen>-<state>.tree.json`, taken in
  the same state and scroll position. A tree is optional.
- Wait until the screen has settled before each shot.
- Capture what a user sees without scrolling. If a screen is taller than
  that, add scrolled shots and name them as separate states.
- Reach each state the way a user would. Check in the code what really
  triggers it: going offline, for example, may count as a cancel rather than
  an error. When a state needs a long wait, such as a timeout, run the wait in
  the background instead of polling.
- Never confirm anything irreversible or outward to reach a state. Capture the
  screen up to the confirmation and stop there.

## Android and iOS

Use T3's device tools, so the user can watch in the Device panel:

1. `device_list`, then `device_open` with the device's `hostId` and `id`. It
   returns an `agent-device` command bound to that device.
2. Build and install the version under test the project's usual way. Builds
   and installs may use `adb` or `simctl`; everything on screen goes through
   `agent-device`.
3. Drive the app with `agent-device`: `open <app-id> --relaunch`,
   `snapshot -i`, `press @ref --settle`, `wait stable`, and
   `screenshot <path>` for each shot.
4. Change system settings with `agent-device settings`, then relaunch the app
   so it picks them up:
   - `text-size <rung>` for large text. Read the scale back afterwards: rung
     names map to different scales on each platform. Android's own maximum
     is 200% from Android 14.
   - `appearance dark` or `light`.
   - Android only: `airplane`, `wifi` or `mobile-data` `on` or `off`. On an
     iOS simulator, `airplane` and `wifi` only change the status bar, and
     the app stays online. Find another real way to reach an offline state
     there, or report that it isn't supported and ask.

## Desktop

Launch the app the project's usual way, at a fixed window size, and capture
the app's window alone, not the whole screen: use the platform's window
screenshot, or computer use if that is what the session has. Note the
display's scale factor, such as 2 on a Retina display. That is the shot's
pixel density.

## Web

Use T3's browser preview tools:

1. `preview_open` with the URL, or with the dev server's port.
2. `preview_resize` for each viewport. By default, capture a phone
   (`preset: pixel-7`) and a desktop (`freeform` 1440 × 900).
3. `preview_snapshot` with `save: true` returns the PNG's path. Copy it to the
   scratch folder under the shot's name. Optionally, without scrolling, run
   the probe below with `preview_evaluate`, as an expression string, and
   save the JSON it returns as the shot's `.tree.json`. It keeps the
   elements that show something: text, media, controls, and boxes with a
   fill, border or shadow.
4. Large text, if the user wants it: raise the root font size, for example
   with `preview_evaluate` setting `document.documentElement.style.fontSize`
   to `200%`. Then check the shot: text sized in pixels or drawn on a canvas
   doesn't grow. Only if the text really grew, say in `{SHOTS}` that it is
   enlarged. Otherwise report the state as unsupported and ask.

The optional web probe:

```js
(() => {
  const out = [];
  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    if (r.width < 1 || r.height < 1 || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (r.bottom <= 0 || r.right <= 0 || r.top >= innerHeight || r.left >= innerWidth) continue;
    if (el.closest('svg') && el.localName !== 'svg') continue;
    const text = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const media = /^(img|svg|video|canvas|input|select|textarea|button|hr)$/.test(el.localName);
    const paints = !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor)
      || cs.backgroundImage !== 'none' || parseFloat(cs.borderTopWidth) > 0
      || parseFloat(cs.borderBottomWidth) > 0 || cs.boxShadow !== 'none';
    if (!text && !media && !paints) continue;
    const label = el.getAttribute('aria-label') || el.getAttribute('alt')
      || (text || media ? el.innerText : '') || '';
    out.push({ label: label.replace(/\s+/g, ' ').trim().slice(0, 40), role: el.localName,
      x: r.x, y: r.y, width: r.width, height: r.height });
  }
  return JSON.stringify({ width: innerWidth, height: innerHeight, elements: out });
})()
```
