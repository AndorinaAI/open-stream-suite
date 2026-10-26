# Contributing to Open Stream Suite

<p align="center">
  <a href="CONTRIBUTING.md">Español</a> | <b>English</b>
</p>

Thank you for helping improve Open Stream Suite! Community contributions and bug reports are warmly welcome.

## License and CLA

The project uses a **dual licence**:

- **Public licence: [GNU AGPL v3.0 or later](../LICENSE)** — free software: you may use, study, modify and redistribute the project for free **as long as you comply with the AGPL** (publish the source of your modifications and impose no further restrictions).
- **Paid commercial licence:** if you are a **company** and want to use it without publishing your code (embedding it in a product, hosted service, white-labelling, redistribution), you need the [commercial licence](../LICENSE-COMMERCIAL.en.md). Contact: **admin@andorina.dev**.
- **Trademarks:** the name, logo and visual identity are covered by **neither** licence → [`TRADEMARK.en.md`](../TRADEMARK.en.md).
- **Third-party assets** (typefaces, icons, Python dependencies) are not covered by the project licence → [`NOTICE.en.md`](../NOTICE.en.md).

> [!IMPORTANT]
> Versions published **before 2026-10-26** were released under **CC BY-NC-SA 4.0**. Copies already delivered to third parties keep those terms; **new versions are governed by AGPL-3.0-or-later**.

### Signing the CLA (mandatory)

To keep the dual-licence model, **every contribution requires accepting the [Contributor Licence Agreement (CLA)](CLA.en.md)**, which grants the Licensor enough rights to **relicense** the project (including its commercial exploitation).

1. Post this **exact** comment in your Pull Request:
   `I have read the CLA Document and I hereby sign the CLA`
2. If you act on behalf of an entity, also add: `on behalf of <Entity>, representing <name and role>`.

Pull requests **without a signature are neither reviewed nor merged** (they will be closed with a link to the CLA). Third-party code without disclosure, and contributions with additional copyleft incompatible with the AGPL and the commercial licence, are not accepted.

## Platforms & Testing
Core development and testing take place **exclusively on Linux**. We do not use proprietary operating systems (Windows or macOS). If you run or develop on Windows or macOS, community feedback, bug reports, and *Pull Requests* are essential for those platforms to progress.

## How to Contribute

1. Open an *issue* describing the bug or feature proposal before embarking on large architectural changes.
2. Fork the repository and create a descriptive branch (`feature/my-feature` or `fix/my-bugfix`).
3. Follow the project architecture standards in [`app/CONVENTIONS.en.md`](../app/CONVENTIONS.en.md).
4. Run the automated test suite from the `app/` directory with the server running:
   ```bash
   ./venv/bin/python3 -m unittest discover tests -v
   ```
5. Open a Pull Request clearly explaining what changed and why. **Include the CLA signature**: post the exact comment `I have read the CLA Document and I hereby sign the CLA` in the PR (see [CLA.en.md](CLA.en.md)). Without a signature the PR is not reviewed.

## Security Rules

- **Never** commit `.env`, `token.json`, or `.local_token`. They are ignored in `.gitignore`.
- Do not register static routes that expose the root of `app/`: it contains sensitive credentials and configuration. Always adhere to the whitelist in `server/routes/static_routes.py`.
- Any new mutating backend endpoints must require the local token (`X-Local-Token`) unless they are intentionally designed for macro deck hardware (`/api/deck/*`).

## Documentation & Localization

If you modify or introduce functionality:
- Keep the guides in `app/docs/` updated.
- Update both Spanish (`languages/es.json`) and English (`languages/en.json`) localization dictionaries.
- If physical deck integrations are affected, update [`plugins/README.en.md`](../plugins/README.en.md).
