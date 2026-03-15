import OpenAI from "openai";
import type {
  ProviderAdapter,
  ProviderConfig,
  ProviderCapabilities,
  TaskInput,
  RunResult,
  StreamChunk,
  CostEstimate,
} from "@athanor/core";
import { randomId, now } from "./util.js";

export class OpenRouterAdapter implements ProviderAdapter {
  readonly kind = "openrouter" as const;
  private client!: OpenAI;
  private config!: ProviderConfig;
  private availableModels: string[] = [];

  async setup(config: ProviderConfig): Promise<void> {
    this.config = config;
    this.client = new OpenAI({
      baseURL: config.baseUrl || "https://openrouter.ai/api/v1",
      apiKey: config.apiKey,
      defaultHeaders: {
        "X-Title": "Athanor",
      },
    });
  }

  async run(task: TaskInput): Promise<RunResult> {
    const id = randomId();
    const startedAt = now();
    const model = task.model || this.config.model || "deepseek/deepseek-chat";

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: task.instructions },
        ...(task.files?.map((f) => ({
          role: "user" as const,
          content: `File: ${f}`,
        })) || []),
      ],
      temperature: 0.7,
    });

    const choice = response.choices[0];
    const usage = response.usage;

    return {
      id,
      experimentId: "",
      strategyId: "",
      variant: "baseline",
      output: choice?.message?.content || "",
      artifacts: [],
      tokens: {
        input: usage?.prompt_tokens || 0,
        output: usage?.completion_tokens || 0,
      },
      cost: 0, // OpenRouter returns cost in x-openrouter headers, parsed separately
      duration: Date.now() - new Date(startedAt).getTime(),
      metadata: { model, provider: "openrouter" },
      startedAt,
      finishedAt: now(),
    };
  }

  async *stream(task: TaskInput): AsyncIterable<StreamChunk> {
    const model = task.model || this.config.model || "deepseek/deepseek-chat";

    const stream = await this.client.chat.completions.create({
      model,
      messages: [{ role: "system", content: task.instructions }],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        yield {
          type: "text",
          content: delta.content,
          timestamp: Date.now(),
        };
      }
    }
  }

  async estimate(task: TaskInput): Promise<CostEstimate> {
    const model = task.model || this.config.model || "deepseek/deepseek-chat";
    const roughTokens = Math.ceil(task.instructions.length / 4);
    return {
      estimatedTokens: roughTokens,
      estimatedCost: 0, // would need model pricing lookup
      model,
      confidence: "low",
    };
  }

  capabilities(): ProviderCapabilities {
    return {
      streaming: true,
      tools: true,
      fileAccess: false,
      codeExecution: false,
      costTracking: true,
      models: this.availableModels,
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  async fetchModels(): Promise<string[]> {
    const response = await this.client.models.list();
    this.availableModels = response.data.map((m) => m.id);
    return this.availableModels;
  }
}
