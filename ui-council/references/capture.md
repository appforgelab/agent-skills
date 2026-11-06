# Capturing states

## Every platform

- Use one device or viewport for every round. Before changing anything, note
  its settings (text size, appearance, network) and restore them at the end.
- Name shots `<n>-<screen>-<state>.png` and keep the same names every round.
  Keep each round's originals in `round-<k>/` in a scratch folder. Give the
  raters a copy in a new folder with a random name, so the path doesn't
  reveal the round.
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
   - `airplane`, `wifi` or `mobile-data` `on` or `off`.

## Web

Use T3's browser preview tools:

1. `preview_open` with the URL, or with the dev server's port.
2. `preview_resize` for each viewport. By default, capture a phone
   (`preset: pixel-7`) and a desktop (`freeform` 1440 × 900).
3. `preview_snapshot` with `save: true` returns the PNG's path. Copy it to the
   round's folder under the shot's name.
4. Large text, if the user wants it: raise the root font size, for example
   with `preview_evaluate` setting `document.documentElement.style.fontSize`
   to `200%`. Say in `{SHOTS}` that the text is enlarged.
