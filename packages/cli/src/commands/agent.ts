import { Command } from "commander";

export const agentCommand = new Command("agent")
  .description("Manage agents");

agentCommand
  .command("create")
  .description("Create a new agent")
  .requiredOption("-n, --name <name>", "Agent name")
  .requiredOption("-p, --provider <provider>", "Provider to use")
  .option("-t, --type <type>", "Job type (coding, content, extraction, automation, research, custom)", "custom")
  .option("-i, --instructions <instructions>", "Agent instructions")
  .option("-f, --instructions-file <file>", "Read instructions from file")
  .option("-d, --working-dir <dir>", "Working directory")
  .option("--repeatable", "Mark as repeatable (enables experiments)")
  .action(async (opts: Record<string, string | boolean>) => {
    console.log("Creating agent:", opts.name);
    console.log("Config:", opts);
    // TODO: validate, store agent config
    console.log("Agent created. (stub — storage not yet wired)");
  });

agentCommand
  .command("list")
  .description("List all agents")
  .action(async () => {
    console.log("No agents configured yet. Run: athanor agent create");
  });

agentCommand
  .command("run <name>")
  .description("Run an agent")
  .option("-t, --task <task>", "Task to run")
  .option("-f, --task-file <file>", "Read task from file")
  .option("--dry-run", "Show what would happen without executing")
  .action(async (name: string, opts: Record<string, string | boolean>) => {
    console.log(`Running agent: ${name}`);
    console.log("Options:", opts);
    // TODO: load agent, run via adapter
    console.log("Run complete. (stub)");
  });

agentCommand
  .command("inspect <name>")
  .description("Show agent details and history")
  .action(async (name: string) => {
    console.log(`Agent: ${name} (stub)`);
  });

agentCommand
  .command("delete <name>")
  .description("Delete an agent")
  .action(async (name: string) => {
    console.log(`Deleting agent: ${name} (stub)`);
  });
