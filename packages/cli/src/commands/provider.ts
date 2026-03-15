import { Command } from "commander";

export const providerCommand = new Command("provider")
  .description("Manage AI providers");

providerCommand
  .command("list")
  .description("List configured providers")
  .action(async () => {
    console.log("No providers configured yet. Run: athanor provider add <kind>");
  });

providerCommand
  .command("add <kind>")
  .description("Add a provider (openrouter, anthropic, openai, ollama, claude-code, aider)")
  .option("-k, --api-key <key>", "API key")
  .option("-m, --model <model>", "Default model")
  .option("-n, --name <name>", "Display name")
  .option("--base-url <url>", "Custom base URL")
  .option("--cli-path <path>", "Path to CLI binary")
  .action(async (kind: string, opts: Record<string, string>) => {
    console.log(`Adding ${kind} provider...`);
    console.log("Options:", opts);
    // TODO: validate kind, store config, verify connection
    console.log("Provider added. (stub — storage not yet wired)");
  });

providerCommand
  .command("remove <name>")
  .description("Remove a provider")
  .action(async (name: string) => {
    console.log(`Removing provider: ${name} (stub)`);
  });

providerCommand
  .command("test <name>")
  .description("Test provider connection")
  .action(async (name: string) => {
    console.log(`Testing provider: ${name} (stub)`);
  });
