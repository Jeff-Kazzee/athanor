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

interface ClaudeCodeOutput {
  result: string;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  duration_ms: number;
  session_id: string;
}

export class ClaudeCodeAdapter implements ProviderAdapter {
  readonly kind = "claude-code" as const;
  private config!: ProviderConfig;
  private cliPath = "claude";

  async setup(config: ProviderConfig): Promise<void> {
    this.config = config;
    if (config.cliPath) this.cliPath = config.cliPath;
  }

  async run(task: TaskInput): Promise<RunResult> {
    const id = randomId();
    const startedAt = now();

    const args = [
      "--print",
      "--output-format",
      "json",
    ];

    if (task.model) {
      args.push("--model", task.model);
    }

    const cmd = `${this.cliPath} ${args.join(" ")} ${JSON.stringify(task.instructions)}`;
    const options: Record<string, unknown> = {
      maxBuffer: 50 * 1024 * 1024,
      timeout: task.timeout || 300_000,
    };

    if (task.workingDir) {
      options.cwd = task.workingDir;
    }

    if (this.config.apiKey) {
      options.env = {
        ...process.env,
        ANTHROPIC_API_KEY: this.config.apiKey,
      };
    }

    try {
      const { stdout } = await execAsync(cmd, options);
      const parsed: ClaudeCodeOutput = JSON.parse(stdout);

      return {
        id,
        experimentId: "",
        strategyId: "",
        variant: "baseline",
        output: parsed.result,
        artifacts: [],
        tokens: {
          input: parsed.input_tokens || 0,
          output: parsed.output_tokens || 0,
        },
        cost: parsed.cost_usd || 0,
        duration: parsed.duration_ms || Date.now() - new Date(startedAt).getTime(),
        exitCode: 0,
        metadata: {
          provider: "claude-code",
          sessionId: parsed.session_id,
        },
        startedAt,
        finishedAt: now(),
      };
    } catch (err: unknown) {
      const error = err as { code?: number; stderr?: string };
      return {
        id,
        experimentId: "",
        strategyId: "",
        variant: "baseline",
        output: "",
        artifacts: [],
        tokens: { input: 0, output: 0 },
        cost: 0,
        duration: Date.now() - new Date(startedAt).getTime(),
        exitCode: error.code || 1,
        metadata: {
          provider: "claude-code",
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
      tools: true,
      fileAccess: true,
      codeExecution: true,
      costTracking: true,
      models: [
        "claude-sonnet-4-6",
        "claude-opus-4-6",
        "claude-haiku-4-5",
      ],
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
