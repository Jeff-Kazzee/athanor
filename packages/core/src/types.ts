import { z } from "zod";

export const ProviderKind = z.enum([
  "openrouter",
  "anthropic",
  "openai",
  "ollama",
  "claude-code",
  "codex-cli",
  "gemini-cli",
  "aider",
  "custom",
]);
export type ProviderKind = z.infer<typeof ProviderKind>;

export const ProviderConfig = z.object({
  id: z.string(),
  kind: ProviderKind,
  name: z.string(),
  model: z.string().optional(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  cliPath: z.string().optional(),
  options: z.record(z.unknown()).optional(),
});
export type ProviderConfig = z.infer<typeof ProviderConfig>;

export const JobType = z.enum([
  "coding",
  "content",
  "extraction",
  "automation",
  "research",
  "custom",
]);
export type JobType = z.infer<typeof JobType>;

export const AgentConfig = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  providerId: z.string(),
  jobType: JobType,
  instructions: z.string(),
  tools: z.array(z.string()).default([]),
  workingDir: z.string().optional(),
  repeatable: z.boolean().default(false),
  schedule: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type AgentConfig = z.infer<typeof AgentConfig>;

export const VerifierType = z.enum([
  "exit-code",
  "test-suite",
  "lint",
  "typecheck",
  "schema",
  "llm-judge",
  "pairwise",
  "external-api",
  "cost-ceiling",
  "runtime-ceiling",
  "custom-script",
]);
export type VerifierType = z.infer<typeof VerifierType>;

export const VerifierConfig = z.object({
  id: z.string(),
  type: VerifierType,
  name: z.string(),
  config: z.record(z.unknown()).default({}),
  weight: z.number().default(1),
});
export type VerifierConfig = z.infer<typeof VerifierConfig>;

export const PromotionRule = z.enum([
  "score-threshold",
  "win-streak",
  "manual",
  "auto-best",
]);
export type PromotionRule = z.infer<typeof PromotionRule>;

export const ExperimentConfig = z.object({
  id: z.string(),
  agentId: z.string(),
  metric: z.string(),
  verifiers: z.array(VerifierConfig),
  promotionRule: PromotionRule.default("score-threshold"),
  promotionThreshold: z.number().default(0.6),
  maxRounds: z.number().optional(),
  budgetPerRound: z.number().optional(),
  active: z.boolean().default(false),
  createdAt: z.string(),
});
export type ExperimentConfig = z.infer<typeof ExperimentConfig>;

export interface RunResult {
  id: string;
  experimentId: string;
  strategyId: string;
  variant: "baseline" | "challenger";
  output: string;
  artifacts: Artifact[];
  tokens: { input: number; output: number };
  cost: number;
  duration: number;
  exitCode?: number;
  metadata: Record<string, unknown>;
  startedAt: string;
  finishedAt: string;
}

export interface Artifact {
  name: string;
  path: string;
  type: string;
  size: number;
}

export interface VerifierResult {
  verifierId: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface RoundResult {
  round: number;
  baseline: RunResult;
  challenger: RunResult;
  baselineScore: number;
  challengerScore: number;
  winner: "baseline" | "challenger";
  verifierResults: {
    baseline: VerifierResult[];
    challenger: VerifierResult[];
  };
  learning: string;
  promotedChallenger: boolean;
}

export interface Strategy {
  id: string;
  experimentId: string;
  version: number;
  instructions: string;
  parentId?: string;
  score?: number;
  rounds: number;
  wins: number;
  createdAt: string;
}

export interface Learning {
  id: string;
  experimentId: string;
  round: number;
  finding: string;
  impact: "positive" | "negative" | "neutral";
  confidence: number;
  createdAt: string;
}

export interface ProviderAdapter {
  readonly kind: ProviderKind;
  setup(config: ProviderConfig): Promise<void>;
  run(task: TaskInput): Promise<RunResult>;
  stream?(task: TaskInput): AsyncIterable<StreamChunk>;
  estimate?(task: TaskInput): Promise<CostEstimate>;
  capabilities(): ProviderCapabilities;
  healthCheck(): Promise<boolean>;
}

export interface TaskInput {
  instructions: string;
  workingDir?: string;
  tools?: string[];
  files?: string[];
  timeout?: number;
  model?: string;
}

export interface StreamChunk {
  type: "text" | "tool_use" | "error" | "cost";
  content: string;
  timestamp: number;
}

export interface CostEstimate {
  estimatedTokens: number;
  estimatedCost: number;
  model: string;
  confidence: "low" | "medium" | "high";
}

export interface ProviderCapabilities {
  streaming: boolean;
  tools: boolean;
  fileAccess: boolean;
  codeExecution: boolean;
  costTracking: boolean;
  models: string[];
}
