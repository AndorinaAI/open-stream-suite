# Contributing to Open Stream Suite

<p align="center">
  <a href="CONTRIBUTING.md">Español</a> | <b>English</b>
</p>

Thank you for helping improve Open Stream Suite! Community contributions and bug reports are warmly welcome.

## License

This project is licensed under the [Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0) License](../LICENSE) with retroactive effect across all commits: free use, modification, study, and distribution **for non-commercial purposes**. Selling it or using it for commercial monetization is strictly prohibited without written consent from the author.

Under the **ShareAlike reciprocity clause**, any fork, modification, or new feature you create and distribute **must be licensed under this exact same license (CC BY-NC-SA 4.0)**, ensuring that all improvements remain free, non-commercial, and can be legally integrated into the upstream project. We encourage you to submit your improvements via a *Pull Request*.

By submitting a contribution, you agree that your code will be distributed under this same license.

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
5. Open a Pull Request clearly explaining what changed and why.

## Security Rules

- **Never** commit `.env`, `token.json`, or `.local_token`. They are ignored in `.gitignore`.
- Do not register static routes that expose the root of `app/`: it contains sensitive credentials and configuration. Always adhere to the whitelist in `server/routes/static_routes.py`.
- Any new mutating backend endpoints must require the local token (`X-Local-Token`) unless they are intentionally designed for macro deck hardware (`/api/deck/*`).

## Documentation & Localization

If you modify or introduce functionality:
- Keep the guides in `app/docs/` updated.
- Update both Spanish (`languages/es.json`) and English (`languages/en.json`) localization dictionaries.
- If physical deck integrations are affected, update [`plugins/README.en.md`](../plugins/README.en.md).
