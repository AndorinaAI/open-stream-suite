# Compatibility and shims (W27/W28)

> Status: **decision closed**. No public contract is removed without a verified
> consumer; internal shims stay to keep third-party imports and published links
> working.

## Kept

- `server/<service>.py` → re-exports of `server/services/<service>.py` for
  scripts and plugins that imported the old path.
- `/scenes/<key>` and `/scenes/<key>/index.html` → redirects to the real scene.
- `common/editor.js` → redirect to `common/overlay/editor.js`.
- `window.TALLER_CONFIG` → alias of `window.OSS_CONFIG`.
- `/api/sound` and `/api/tips/recent`: documented external API; kept with their
  current security controls.

## Removed

- No new aliases or duplicate endpoints are added.
- Wrappers that only forward to a module with no consumers are debt: before
  deleting one, check imports, tests, docs and plugins.

## Rule for future cleanup

1. Search the name in `app/`, `plugins/`, `tests/` and docs.
2. No consumer and no published contract → delete the wrapper and update docs.
3. Public contract → keep it and add a deprecation date.
