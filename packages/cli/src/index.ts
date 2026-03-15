#!/usr/bin/env node
import { Command } from "commander";
import { providerCommand } from "./commands/provider.js";
import { agentCommand } from "./commands/agent.js";
import { experimentCommand } from "./commands/experiment.js";

const program = new Command();

program
  .name("athanor")
  .description("AI agent manager with self-improving experiment loops")
  .version("0.1.0");

program.addCommand(providerCommand);
program.addCommand(agentCommand);
program.addCommand(experimentCommand);

program.parse();
