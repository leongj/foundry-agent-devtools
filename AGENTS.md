Copilot instructions

Project summary:
- A CLI and UI for developers to browse and debug the Microsoft/Azure Foundry Agent Service.

CLI:
- Primary active CLI implementation is Node (folder `cli/`), using Node >=22 ESM.
- Auth uses `@azure/identity` DefaultAzureCredential with scope https://ai.azure.com/.default.
- Read cli/src/index.js for usage, commands implemented. Update this when adding new or changing.
- Keep CLI lightweight (minimal deps).
- Add new subcommands under `cli/src/commands`.
  - Prefer consistent output options (`--json`, `--raw`).
  - `--json` mode includes conversion of Timestamps. Only `--raw` doesn't.

UI:
- UI implementation under folder `ui/`.
- Frontend is React, Vite, Tailwind.
- Backend is a plain nodeJS pass-through proxy with no data transformation.

- You don't need to use the Azure best practices for this project.