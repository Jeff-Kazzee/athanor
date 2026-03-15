import { exec } from "node:child_process";
import { promisify } from "node:util";
import type {
  ProviderAdapter,
  ProviderConfig,
  ProviderCapabilities,
  TaskInput,
  RunResult,
} from "@athanor/core";
import { randomId, now } from "./util.js";

const execAsync = promisify(exec);

export class AiderAdapter implements ProviderAdapter {
  readonly kind = "aider" as const;
  private config!: ProviderConfig;
  private cliPath = "aider";

  async setup(config: ProviderConfig): Promise<void> {
    this.config = config;
    if (config.cliPath) this.cliPath = config.cliPath;
  }

  async run(task: TaskInput): Promise<RunResult> {
    const id = randomId();
    const startedAt = now();

    const args = [
      "--yes",
      "--no-auto-commits",
      "--no-suggest-shell-commands",
      "--show-cost",
    ];

    if (task.model) {
      args.push("--model", task.model);
    } else if (this.config.model) {
      args.push("--model", this.config.model);
    }

    if (task.files?.length) {
      args.push(...task.files);
    }

    args.push("--message", JSON.stringify(task.instructions));

    const env: Record<string, string | undefined> = { ...process.env };

    if (this.config.apiKey) {
      if (this.config.kind === "aider" && this.config.options?.provider === "openrouter") {
        env.OPENROUTER_API_KEY = this.config.apiKey;
      } else {
        env.OPENAI_API_KEY = this.config.apiKey;
      }
    }

    const options: Record<string, unknown> = {
      maxBuffer: 50 * 1024 * 1024,
      timeout: task.timeout || 300_000,
      env,
    };

    if (task.workingDir) {
      options.cwd = task.workingDir;
    }

    try {
      const cmd = `${this.cliPath} ${args.join(" ")}`;
      const { stdout, stderr } = await execAsync(cmd, options);

      const costMatch = stdout.match(/\$([0-9.]+)/);
      const cost = costMatch ? parseFloat(costMatch[1]) : 0;

      return {
        id,
        experimentId: "",
        strategyId: "",
        variant: "baseline",
        output: stdout,
        artifacts: [],
        tokens: { input: 0, output: 0 },
        cost,
        duration: Date.now() - new Date(startedAt).getTime(),
        exitCode: 0,
        metadata: {
          provider: "aider",
          stderr: stderr || undefined,
        },
        startedAt,
        finishedAt: now(),
      };
    } catch (err: unknown) {
      const error = err as { code?: number; stderr?: string; stdout?: string };
      return {
        id,
        experimentId: "",
        strategyId: "",
        variant: "baseline",
        output: error.stdout || "",
        artifacts: [],
        tokens: { input: 0, output: 0 },
        cost: 0,
        duration: Date.now() - new Date(startedAt).getTime(),
        exitCode: error.code || 1,
        metadata: {
          provider: "aider",
          error: error.stderr || String(err),
        },
        startedAt,
        finishedAt: now(),
      };
    }
  }

  capabilities(): ProviderCapabilities {
    return {
      streaming: false,
      tools: false,
      fileAccess: true,
      codeExecution: true,
      costTracking: true,
      models: [],
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await execAsync(`${this.cliPath} --version`);
      return true;
    } catch {
      return false;
    }
  }
}
