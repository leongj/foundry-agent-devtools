import { parseArgs } from './util/args.js';
import { dispatch } from './util/dispatch.js';

(async () => {
  try {
    const ctx = parseArgs(process.argv.slice(2));
    if (ctx.help) {
      printHelp();
      process.exit(0);
    }
    await dispatch(ctx);
  } catch (err) {
    if (err && err.code === 'USAGE') {
      console.error(err.message);
      console.error('Use --help for usage.');
      process.exit(2);
    }
    console.error('[ERROR]', err.message || err);
    if (process.env.AZA_DEBUG || process.argv.includes('--debug')) {
      console.error(err.stack);
    }
    process.exit(1);
  }
})();

function printHelp() {
  console.log(`aza - Azure AI Agents CLI

Support for Foundry Agent Service v2
https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview?view=foundry
as well as v1 (Classic):
https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview?view=foundry-classic

Usage (v2):
  aza agents list [--limit N --order asc|desc --after ID --before ID]
  aza agents show <agentName>
  aza responses list [--limit N --order asc|desc --after ID --before ID]
  aza responses show <responseId>
  aza conversations list [--limit N --order asc|desc --after ID --before ID]
  aza conversations show <conversationId>

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

Global flags:
  -p, --project <endpoint>   Base endpoint containing project (or set AZA_PROJECT)
      --api-version <ver>     Override API version (default v1 or AZA_API_VERSION)
      --json                  Output prettified JSON (_at timestamps converted)
      --raw                   Output raw from API
      --debug                 Verbose HTTP debug output
      --help                  Show this help

Examples:
  AZA_PROJECT=https://myendpoint/projects/12345/v1 aza agents list
  aza -p https://myendpoint/projects/12345/v1 files list --json
  aza responses list --limit 20
  aza vs files list vst_123456789
  aza vs files show vst_123456789 file_abcdef`);
}
