# aza - The Microsoft Foundry Agent Service CLI

A lightweight CLI for Microsoft Foundry Agent Service.  
Now updated to Support for [Foundry Agent Service v2](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview?view=foundry)
as well as [v1 (Classic)](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview?view=foundry-classic)

## Requirements
- Node runtime (Node >=22, ESM)
- Auth via  [DefaultAzureCredential](https://learn.microsoft.com/en-gb/azure/developer/javascript/sdk/authentication/credential-chains#defaultazurecredential-overview) (easiest via [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest))

## Installation
Install deps:

```bash
cd cli && npm install
```


## Authentication

Foundry Agent Service requires an authenticated user or service principal to access. AZA uses [DefaultAzureCredential](https://learn.microsoft.com/en-gb/azure/developer/javascript/sdk/authentication/credential-chains#defaultazurecredential-overview) which adapts to a whichever creds are available. 

This is easiest done by using [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

Run `az login` or provide env vars (`AZURE_CLIENT_ID`, etc.). Scope used: `https://ai.azure.com/.default`.


## Usage
To run:
```bash
./bin/aza <args>
```

(Optionally add `cli/bin` to PATH.)


```text
Usage (v2):
	aza agents list [--limit N --order asc|desc --after ID --before ID]
	aza agents show <agentName>
	aza resp[onses] list [--limit N --order asc|desc --after ID --before ID]
	aza resp[onses] show <responseId>
	aza conv[ersations] list [--limit N --order asc|desc --after ID --before ID]
	aza conv[ersations] show <conversationId>

Usage (v1):
	aza agents list [--limit N --order asc|desc --after ID --before ID] -v1
	aza agents show <agentId> -v1
	aza threads list
	aza threads show <threadId>
	aza threads runs list <threadId>
	aza threads runs show <threadId> <runId>
	aza runs list <threadId>
	aza runs show <threadId> <runId>

Usage (common for v1 and v2):
	aza files list [--limit N --order asc|desc --after ID --before ID]
	aza files show <fileId>
	aza vs list
	aza vs show <vectorStoreId>
	aza vs files list <vectorStoreId>
	aza vs files show <vectorStoreId> <fileId>
```

Flags:

- `-p, --project` or env `AZA_PROJECT` = base endpoint including project id
- `--api-version` (default v1 / env `AZA_API_VERSION`)
- `--json` pretty JSON (`_at` timestamps converted)
- `--raw` raw body
- `--debug` verbose HTTP
- `--help` show built-in usage

Examples:

```bash
AZA_PROJECT=https://myendpoint/projects/12345/v1 aza agents list
aza -p https://myendpoint/projects/12345/v1 files list --json
aza responses list --limit 20
aza vs files list vst_123456789
aza vs files show vst_123456789 file_abcdef
```

Agents command maps to REST `assistants` endpoint (naming aligned to docs).

## Experimental web UI

A minimal browser front-end now lives under `ui/`. It reuses the same authentication + HTTP helpers as the CLI and currently focuses on listing agents.

Steps:

1. Make sure you have already run `npm install` inside `cli/` so `@azure/identity` is available, and authenticate with `az login` (or provide `AZURE_CLIENT_ID`, etc.).
2. Set your project endpoint in the shell (`export AZA_PROJECT=https://myendpoint/projects/12345/v1`).
3. Start the UI server:

	```bash
	cd ui
	npm start
	```

4. Open `http://localhost:4173` in a browser, paste the same project endpoint (or leave the field blank to rely on `AZA_PROJECT`), and click **Load agents**.

The page shows agent metadata, supports both v2 preview + legacy v1 listings, and stores the last-used settings locally so you can refresh quickly. More surface area (threads, runs, vector stores, etc.) can be layered on later.
