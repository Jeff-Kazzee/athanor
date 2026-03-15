import { Command } from "commander";

export const experimentCommand = new Command("experiment")
  .alias("exp")
  .description("Manage experiments");

experimentCommand
  .command("start <agent>")
  .description("Start an experiment on an agent")
  .requiredOption("-m, --metric <metric>", "Metric to optimize")
  .option("-v, --verifier <verifiers...>", "Verifiers to use")
  .option("--promotion-rule <rule>", "Promotion rule (score-threshold, win-streak, manual, auto-best)", "score-threshold")
  .option("--threshold <n>", "Promotion threshold", "0.6")
  .option("--max-rounds <n>", "Maximum experiment rounds")
  .option("--budget <n>", "Budget per round in USD")
  .action(async (agent: string, opts: Record<string, string | string[]>) => {
    console.log(`Starting experiment on agent: ${agent}`);
    console.log("Metric:", opts.metric);
    console.log("Config:", opts);
    // TODO: create experiment, start loop
    console.log("Experiment started. (stub)");
  });

experimentCommand
  .command("status [agent]")
  .description("Show experiment status")
  .action(async (agent?: string) => {
    if (agent) {
      console.log(`Experiment status for ${agent}: (stub)`);
    } else {
      console.log("No active experiments. (stub)");
    }
  });

experimentCommand
  .command("history <agent>")
  .description("Show experiment history and learnings")
  .option("--rounds <n>", "Number of recent rounds to show", "10")
  .action(async (agent: string, opts: Record<string, string>) => {
    console.log(`Experiment history for ${agent} (last ${opts.rounds} rounds): (stub)`);
  });

experimentCommand
  .command("stop <agent>")
  .description("Stop a running experiment")
  .action(async (agent: string) => {
    console.log(`Stopping experiment on ${agent}: (stub)`);
  });

experimentCommand
  .command("promote <agent>")
  .description("Manually promote current challenger to baseline")
  .action(async (agent: string) => {
    console.log(`Promoting challenger for ${agent}: (stub)`);
  });

experimentCommand
  .command("learnings <agent>")
  .description("Show accumulated learnings")
  .action(async (agent: string) => {
    console.log(`Learnings for ${agent}: (stub)`);
  });
