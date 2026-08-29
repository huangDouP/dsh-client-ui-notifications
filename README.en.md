# @dsh-external/dsh-client-ui-notifications

[中文](README.md) | **English**

Waiting / completion notifications for DSH Web: when DSH needs you back (approval / question waiting, turn complete, errors) while you are busy elsewhere, it reminds you with **browser notifications, tab title flash, favicon badge, and native Windows toasts** — everything toggleable in **Settings → Notifications**.

## Screenshots

Browser notification (Windows notification center, sourced from the browser):

![Browser notification](assets/screenshots/browser-notification.png)

Native Windows toast (fired by the DSH host process — works even with the browser fully closed):

![Native Windows toast](assets/screenshots/win-11-notification.png)

## Notification mechanisms (and prerequisites)

| Scenario | Signal source (all native DSH contracts, no custom channel) | Default |
|---|---|---|
| Waiting for approval | `approval` appears in the session snapshot `pending` | on |
| Waiting for a question | `question` appears in the session snapshot `pending` | on (same switch as approval) |
| Turn complete | session snapshot `running: true → false` | on |
| Errors | `lastAgentError` becomes non-empty in the session snapshot | on |

Presentation (all configurable):

- **Browser notifications** (`Notification` API): the browser asks for “allow notifications” permission once — the familiar “this site wants to send notifications” flow. Once granted, notifications appear in the system notification center even when you switch windows.
- **Tab title flash**: while the tab is in the background, the title alternates between “⚠ / ✅ prefix + original title”; stops after at most 30 seconds or when you return to the page.
- **Favicon badge**: a red dot is overlaid on the favicon while the tab is in the background; removed when you return.
- **Sound**: a short WebAudio beep (warmed up on the first click / key press to work around the browser autoplay policy).
- **Native system notifications** (`nativeToast` switch, off by default): DSH's host process raises a Windows toast directly — **it works even when the browser is fully closed**. Zero-dependency (built-in WinRT implementation invoked through Windows PowerShell 5.1); if the BurntToast module is installed it is used automatically for nicer styling. Host-side changes take effect after a restart.
- **Cooldown**: the same notification kind fires at most once per 30 seconds by default (configurable).

Reminders fire only while the window is **unfocused** (background tab or another window), so they never disturb you while you are actively looking at DSH.

## Structure

- `src/index.ts` — Host-half source (TypeScript): registers the `notifications` settings namespace (schemastery schema + defaults), listens to `approval/request` / `agent/status` / `agent/error`, and raises native Windows toasts (zero-dependency WinRT, optional BurntToast).
- `src/client/index.ts` — Client-half source (TypeScript): watches `sessions.list` / per-session snapshots, detects the signals above, and presents notifications; registers the `settings.section` settings page; ships zh/en dictionaries.
- `build.mjs` — build script (esbuild): `src/index.ts` → `lib/index.js` (ESM), `src/client/index.ts` → `lib/client.js` (`window.__ModuleLoader__` bundle).
- `lib/` — build output (committed; used directly at install time).
- `cordis.patch.yml` — inserts this package's composition row into the profile (same mechanism as the installed skin packages; `dsh.bundle.patch` applies automatically).

## Development / build

```sh
pnpm install        # install esbuild / typescript devDependencies
pnpm build          # regenerate lib/index.js + lib/client.js
pnpm typecheck      # tsc --noEmit (optional)
```

Commit rule: `lib/` is build output and **must be committed** (`github:` installs do not run a build). After editing `src/`, run `pnpm build` before committing; CI (`.github/workflows/build.yml`) verifies `lib/` matches the build.

## Installation

**Install from GitHub (shared)** — in `~/.dsh/profiles/<your-profile>/package.json`:

```json
{
  "dependencies": {
    "@dsh-external/dsh-client-ui-notifications": "github:huangDouP/dsh-client-ui-notifications"
  },
  "dsh": {
    "profile": {
      "bundles": [
        "@deepseek-ai/dsh-base",
        "@deepseek-ai/dsh-web-app",
        "@dsh-external/dsh-client-ui-notifications"
      ]
    }
  }
}
```

Then `pnpm install`, and **restart dsh** (a new plugin set only takes effect after a restart).

> For monorepos with the package in a subdirectory, use `github:<user>/<repo>#path:/<subdir>`.
> Same mechanism as the skin packages: the bundle's own `cordis.patch.yml` (`dsh.bundle.patch`) inserts the composition row when the profile loads the bundle — no manual edits to the profile's `cordis.patch.yml` are needed.

**Local development install**: `"@dsh-external/dsh-client-ui-notifications": "file:<absolute-path>"`, or copy the package into `node_modules/@dsh-external/`.

## Sharing on GitHub (repo configuration)

- Suggested repo name: `dsh-client-ui-notifications` (matches the official `dsh-client-ui-*` naming).
- **Topics (required)**: `dsh-plugin` (community plugin marketplaces discover plugins through this topic — 1800+ repos), `deepseek-harness`, `dsh`, `client-plugin`, `notifications`.
- Suggested description: `DSH Web notifications: browser notifications, tab title flash, favicon badge, and native Windows toasts with a bilingual (zh/en) settings page.`
- License: MIT (this package is already MIT; put a `LICENSE` file at the repo root).
- Versioning: `git tag v0.1.0` + a GitHub Release (markets/installs prefer tagging).

## Known limitations

- Browser notifications require the page to be open (a background tab is fine, but the whole tab must not be closed); **native system notifications** (the `nativeToast` switch) are raised by the host and work even with the browser fully closed (zero-dependency WinRT; installing BurntToast yields nicer styling).
- `error` detection relies on the `lastAgentError` snapshot field; subagent / workflow-completion notifications are not in v1 (the session snapshot does not carry those signals).
- The settings page is a real module-level persistent setting (written to `~/.dsh/settings.yaml`), it survives restarts — unlike transient dynamic-plugin settings.
