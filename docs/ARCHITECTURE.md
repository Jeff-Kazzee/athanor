# Athanor — Architecture Document

**Version:** 0.1
**Last updated:** 2026-03-15

---

## System overview

Athanor is a local-first desktop application with a companion CLI. Everything runs on the user's machine. The only outbound network calls are to the user's chosen AI providers.

```
┌─────────────────────────────────────────────────────────┐
│                    User's Machine                        │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │  Electron App │    │     CLI      │                   │
│  │  (React UI)   │    │ (Commander)  │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                            │
│         └───────┬───────────┘                            │
│                 ▼                                         │
│  ┌──────────────────────────────┐                        │
│  │         @athanor/core        │                        │
│  │                              │                        │
│  │  ┌────────┐ ┌────────────┐   │                        │
│  │  │ Agent  │ │ Experiment │   │                        │
│  │  │Manager │ │  Engine    │   │                        │
│  │  └────┬───┘ └─────┬──────┘   │                        │
│  │       │           │          │                        │
│  │  ┌────▼───────────▼──────┐   │                        │
│  │  │      Storage          │   │                        │
│  │  │  (SQLite + filesystem)│   │                        │
│  │  └───────────────────────┘   │                        │
│  └──────────────┬───────────────┘                        │
│                 │                                         │
│                 ▼                                         │
│  ┌──────────────────────────────┐                        │
│  │       @athanor/adapters      │                        │
│  │                              │                        │
│  │  ┌──────────┐ ┌───────────┐  │                        │
│  │  │OpenRouter│ │Claude Code│  │                        │
│  │  └────┬─────┘ └─────┬─────┘  │                        │
│  │  ┌────▼─────┐ ┌─────▼─────┐  │                        │
│  │  │  Aider   │ │  Ollama   │  │                        │
│  │  └──────────┘ └───────────┘  │                        │
│  └──────────────────────────────┘                        │
│                 │                                         │
└─────────────────┼───────────────────────────────────────┘
                  │
                  ▼  (user's own keys/subscriptions)
        ┌─────────────────┐
        │ External APIs   │
        │ & CLI runtimes  │
        └─────────────────┘
```

---

## Package architecture

### Monorepo structure
```
athanor/
├── packages/
│   ├── core/           # Types, schemas, experiment engine, storage, business logic
│   ├── adapters/       # Provider adapter implementations
│   ├── cli/            # Commander.js CLI (npm package: "athanor")
│   ├── app/            # Electron desktop application
│   └── ui/             # Shared React component library
├── docs/               # Architecture, PRD, design, research
├── package.json        # Root workspace config
├── turbo.json          # Turborepo pipeline config
└── tsconfig.base.json  # Shared TypeScript config
```

### Dependency graph
```
@athanor/app  ──→  @athanor/ui  ──→  @athanor/core
     │                                     ▲
     └──→  @athanor/adapters  ─────────────┘
                    ▲
     athanor (cli) ─┘
```

`@athanor/core` has zero internal dependencies — it defines the contracts.
`@athanor/adapters` depends on core for types.
CLI and App depend on both core and adapters.
UI depends on core for types but not adapters.

---

## Tech stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Desktop shell | Electron | Cross-platform, proven for developer tools, access to Node.js APIs |
| UI framework | React 19 + TypeScript | Standard, fast, large ecosystem |
| Styling | Tailwind CSS 4 | Utility-first, opinionated design system possible |
| Local database | SQLite via better-sqlite3 | Zero-config, single-file, fast, no server process |
| ORM / query | Drizzle ORM | Type-safe, lightweight, SQLite-native |
| CLI framework | Commander.js | Simple, well-documented, minimal overhead |
| Build system | Turborepo + tsc | Fast builds, workspace-aware caching |
| Package manager | npm workspaces | Standard, no extra tooling |
| Electron builder | electron-builder | Handles packaging for macOS/Linux/Windows |
| Testing | Vitest | Fast, TypeScript-native, compatible with the rest of the stack |

---

## Data model

### Storage strategy

Athanor uses a hybrid storage approach:

- **SQLite** for structured, queryable data: agents, experiments, runs, scores, learnings index
- **Filesystem** for large/opaque artifacts: agent instructions, run outputs, learning documents, exported data

All stored under `~/.athanor/` (configurable via `ATHANOR_HOME` env var or `athanor config set home <path>`).

### Directory layout (user's machine)
```
~/.athanor/
├── config.json                    # Global config, provider credentials (encrypted)
├── db.sqlite                      # Structured data
├── agents/
│   └── <agent-id>/
│       ├── agent.json             # Agent config snapshot
│       ├── instructions.md        # Current instructions
│       └── runs/
│           └── <run-id>/
│               ├── run.json       # Run metadata (cost, tokens, duration)
│               ├── output.txt     # Raw output
│               └── artifacts/     # Any files produced
├── experiments/
│   └── <experiment-id>/
│       ├── experiment.json        # Experiment config
│       ├── learnings.md           # Accumulated learnings document
│       ├── strategies/
│       │   └── <strategy-id>.md   # Strategy instructions + metadata
│       └── rounds/
│           └── <round-number>/
│               ├── round.json     # Round results, scores, verdict
│               ├── baseline/      # Baseline run artifacts
│               └── challenger/    # Challenger run artifacts
└── logs/
    └── athanor.log                # Application log
```

### SQLite schema (core tables)

```sql
-- Providers
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,          -- openrouter, claude-code, aider, ollama, etc.
  name TEXT NOT NULL,
  model TEXT,
  config_json TEXT,            -- encrypted JSON blob for keys/options
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Agents
CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  provider_id TEXT NOT NULL REFERENCES providers(id),
  job_type TEXT NOT NULL,
  instructions_path TEXT,      -- path to instructions.md
  tools_json TEXT,             -- JSON array of tool names
  working_dir TEXT,
  repeatable INTEGER DEFAULT 0,
  schedule TEXT,               -- cron expression or null
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Experiments
CREATE TABLE experiments (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  metric TEXT NOT NULL,
  verifiers_json TEXT NOT NULL, -- JSON array of verifier configs
  promotion_rule TEXT NOT NULL,
  promotion_threshold REAL DEFAULT 0.6,
  max_rounds INTEGER,
  budget_per_round REAL,
  active INTEGER DEFAULT 0,
  current_baseline_id TEXT,    -- references strategies(id)
  total_rounds INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Strategies (baseline and challenger variants)
CREATE TABLE strategies (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  version INTEGER NOT NULL,
  instructions_path TEXT,
  parent_id TEXT REFERENCES strategies(id),
  total_score REAL DEFAULT 0,
  total_rounds INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  is_baseline INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

-- Runs (individual executions)
CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  experiment_id TEXT,
  strategy_id TEXT,
  agent_id TEXT NOT NULL REFERENCES agents(id),
  variant TEXT,                -- 'baseline', 'challenger', or null for non-experiment runs
  output_path TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  cost REAL DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  exit_code INTEGER,
  metadata_json TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT
);

-- Verifier results (per-run scoring)
CREATE TABLE verifier_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES runs(id),
  verifier_id TEXT NOT NULL,
  passed INTEGER,
  score REAL,
  details TEXT,
  created_at TEXT NOT NULL
);

-- Rounds (experiment round results)
CREATE TABLE rounds (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  round_number INTEGER NOT NULL,
  baseline_run_id TEXT REFERENCES runs(id),
  challenger_run_id TEXT REFERENCES runs(id),
  baseline_score REAL,
  challenger_score REAL,
  winner TEXT,                 -- 'baseline' or 'challenger'
  promoted INTEGER DEFAULT 0,
  learning TEXT,
  created_at TEXT NOT NULL
);

-- Learnings index (searchable)
CREATE TABLE learnings (
  id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL REFERENCES experiments(id),
  round_number INTEGER,
  finding TEXT NOT NULL,
  impact TEXT,                 -- 'positive', 'negative', 'neutral'
  confidence REAL,
  tags_json TEXT,              -- JSON array of tags for filtering
  created_at TEXT NOT NULL
);
```

---

## Provider adapter contract

Every provider adapter implements a common interface. This is the critical abstraction that makes Athanor provider-agnostic.

```typescript
interface ProviderAdapter {
  readonly kind: ProviderKind;

  // Lifecycle
  setup(config: ProviderConfig): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Execution
  run(task: TaskInput): Promise<RunResult>;
  stream?(task: TaskInput): AsyncIterable<StreamChunk>;

  // Cost awareness
  estimate?(task: TaskInput): Promise<CostEstimate>;

  // Discovery
  capabilities(): ProviderCapabilities;
}
```

### Adapter categories

**API adapters** (OpenRouter, direct Anthropic/OpenAI):
- Use HTTP requests via OpenAI SDK (OpenRouter is OpenAI-compatible)
- Return structured results with token counts and cost
- Support streaming
- Can list available models

**CLI adapters** (Claude Code, Aider, Codex, Gemini):
- Spawn child processes
- Parse stdout/stderr for results
- Use tool-specific flags for headless operation
- Capture cost from tool's own reporting
- Track changes via git diff (especially Aider)

**Local adapters** (Ollama, LM Studio):
- Same as API adapters but pointed at localhost
- No cost tracking (free)
- Model availability depends on what user has pulled/installed

### Adapter implementation details

See `docs/PROVIDER-RESEARCH.md` for per-tool auth, flags, and automation capabilities.

---

## Experiment engine

The experiment engine is the core differentiator. It orchestrates the baseline-vs-challenger loop.

### Flow

```
┌─────────────────┐
│  Start experiment│
└────────┬────────┘
         ▼
┌─────────────────┐
│ Load baseline    │ ← current best strategy
│ strategy         │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Generate         │ ← LLM creates variant informed by learnings
│ challenger       │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Run baseline     │ ← execute via provider adapter
│ on task          │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Run challenger   │ ← same task, different strategy
│ on task          │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Score both       │ ← run all verifiers, compute composite score
│ with verifiers   │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Compare scores   │
│ apply promotion  │──→ challenger wins? promote to baseline
│ rule             │──→ challenger loses? discard
└────────┬────────┘
         ▼
┌─────────────────┐
│ Record learnings │ ← what worked, what didn't, why
└────────┬────────┘
         ▼
┌─────────────────┐
│ Check stop       │──→ max rounds? budget exceeded? manual stop?
│ conditions       │
└────────┬────────┘
         │ continue
         └──→ (back to "Generate challenger")
```

### Challenger generation

The system generates challengers using an LLM (via the user's configured provider). The generation prompt includes:

1. The current baseline strategy
2. The metric being optimized
3. All accumulated learnings from previous rounds
4. The most recent round results (what the baseline scored, what the last challenger tried)
5. Constraints: "change one thing at a time" or "make a structural change" depending on experiment phase

This is where Athanor's value compounds: the more rounds run, the richer the context for generating better challengers.

### Scoring

Each verifier returns a `VerifierResult` with:
- `passed: boolean` — hard pass/fail
- `score: number` — 0.0 to 1.0 normalized score
- `details: string` — human-readable explanation

The experiment engine computes a composite score by:
1. Checking all hard verifiers first (if any fail, score = 0)
2. Computing weighted average of graded verifier scores
3. Applying cost/time penalties if over budget

### Learning accumulation

After each round, the engine:
1. Summarizes what was different between baseline and challenger
2. Records whether the difference helped or hurt
3. Extracts a reusable finding (e.g., "shorter prompts with explicit constraints outperform verbose instructions")
4. Appends to the experiment's `learnings.md` file
5. Indexes the learning in SQLite for search

When learnings exceed a threshold (e.g., 50 entries or 10K tokens), the engine runs a compression step: an LLM summarizes the learnings into consolidated principles, archives the raw entries, and starts fresh with the distilled knowledge.

---

## Electron app architecture

### Process model

```
┌──────────────────────────────────┐
│          Main Process            │
│                                  │
│  ┌────────────┐ ┌─────────────┐  │
│  │ IPC Bridge │ │ Experiment  │  │
│  │            │ │ Scheduler   │  │
│  └──────┬─────┘ └──────┬──────┘  │
│         │              │         │
│  ┌──────▼──────────────▼──────┐  │
│  │    @athanor/core           │  │
│  │    @athanor/adapters       │  │
│  │    SQLite connection       │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         ▲ IPC
         │
         ▼
┌──────────────────────────────────┐
│        Renderer Process          │
│                                  │
│  ┌────────────────────────────┐  │
│  │  React App (@athanor/ui)   │  │
│  │                            │  │
│  │  - Agent list / dashboard  │  │
│  │  - Agent detail / run view │  │
│  │  - Experiment dashboard    │  │
│  │  - Provider settings       │  │
│  │  - Learning browser        │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
```

- **Main process:** owns the database, runs adapters (spawns child processes for CLI agents), manages experiment scheduling
- **Renderer process:** React UI, communicates with main via IPC
- **No web server:** the app doesn't expose any ports or HTTP endpoints

### Build tooling
- Vite for bundling the renderer (React)
- tsc for the main process
- electron-builder for packaging

---

## CLI architecture

The CLI is a standalone npm package that shares core and adapters. It can operate independently of the Electron app.

```
athanor (cli entry)
  ├── commands/
  │   ├── setup.ts       # First-time configuration
  │   ├── config.ts      # Read/write config
  │   ├── provider.ts    # CRUD providers
  │   ├── agent.ts       # CRUD + run agents
  │   └── experiment.ts  # CRUD + manage experiments
  └── (imports @athanor/core, @athanor/adapters)
```

The CLI and Electron app share the same `~/.athanor/` data directory and SQLite database. You can create an agent in the CLI and see it in the app, or vice versa. The database handles concurrent access via SQLite's WAL mode.

---

## Security considerations

- **API keys** are stored in `config.json` with filesystem-level encryption (using the OS keychain where available, falling back to encrypted file with user-provided passphrase)
- **No telemetry.** Zero outbound calls except to user-configured providers.
- **CLI agents** run as child processes with the user's permissions. Athanor does not sandbox them further — the user is responsible for what their agents can do.
- **Experiment budgets** are enforced in the engine: if a round exceeds the configured budget, the experiment pauses and notifies the user.
- **No remote code execution.** Custom verifier scripts are run locally by the user's own shell.

---

## Performance considerations

- SQLite with WAL mode for concurrent read/write from CLI and Electron
- Experiment rounds are sequential by default (one at a time per experiment), but multiple experiments can run in parallel across different agents
- Large artifacts (run outputs, diffs) stored on filesystem, not in SQLite
- Learning compression prevents unbounded growth of context
- Provider adapters enforce timeouts (configurable, default 5 minutes)

---

## Future architecture considerations (post-v1)

These are not planned for v1 but the architecture should not preclude them:

- **Background daemon:** a long-running process that manages experiment schedules independent of the Electron app being open
- **Web dashboard:** a local web UI alternative to Electron (for headless server environments)
- **Remote workers:** ability to dispatch runs to remote machines (your own servers, not a cloud service)
- **Shared learnings:** opt-in publishing of anonymized learnings to a community knowledge base
- **Plugin system:** formal API for third-party verifiers and adapters
