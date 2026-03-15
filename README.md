# Athanor

*The alchemist's furnace — a self-sustaining fire for continuous refinement.*

A local-first AI agent manager where agents get measurably better at their jobs over time.

Athanor runs baseline-vs-challenger experiments on your agents, scores results with real verifiers, promotes winners, and accumulates learnings. The experiment engine is the differentiator — but the product is a general-purpose agent tool that works without it.

**Free and open source.** Your data stays on your machine. Bring your own API keys and CLI subscriptions.

## Status

**Pre-alpha.** Architecture designed, type contracts defined, documentation complete. Implementation has not started.

Read the docs to understand what we're building:

| Document | What's in it |
|----------|-------------|
| [PRD](docs/PRD.md) | Product requirements — what Athanor is, core concepts, user experience, revenue model |
| [Architecture](docs/ARCHITECTURE.md) | System design — package structure, data model, SQLite schema, adapter contracts, experiment engine flow |
| [Design Brief](docs/DESIGN-BRIEF.md) | Visual direction — typography (Syne/Satoshi/JetBrains Mono), color palette, spacing, component style, key screens |
| [Provider Research](docs/PROVIDER-RESEARCH.md) | Per-tool research — OpenRouter, Claude Code, Aider, Codex, Gemini CLI, Ollama. Auth, headless flags, automation patterns |
| [Implementation Plan](docs/IMPLEMENTATION-PLAN.md) | Phased build plan — Phase 1 (core + CLI), Phase 2 (Electron app), Phase 3 (distribution), Phase 4 (growth) |
| [Competitive Landscape](docs/COMPETITIVE-LANDSCAPE.md) | Where Athanor sits relative to autoresearch, ACE, DSPy, Promptfoo, Braintrust, and desktop agent tools |

## The idea

Most AI agent tools are fire-and-forget. Run a task, get a result, move on. If the result was bad, tweak the prompt manually and try again. That's not a system — that's guessing.

Athanor turns agent workflows into measurable experiments:

1. Define an agent with a repeatable job
2. Set a metric and verifiers (test suite, lint, LLM judge, API query, custom script)
3. Athanor runs the current baseline strategy
4. Generates a challenger variant informed by accumulated learnings
5. Scores both with verifiers
6. Promotes the winner, records what worked and why
7. Repeats — each round starts smarter than the last

The pattern comes from Karpathy's [autoresearch](https://github.com/karpathy/autoresearch): tight loop, clear metric, bounded search space. Athanor generalizes it beyond ML training to any agent task with measurable outcomes.

## Architecture

Electron desktop app + CLI, installable via npm.

```
athanor/
├── packages/
│   ├── core/       # Types, schemas, experiment engine, storage
│   ├── adapters/   # Provider adapters (OpenRouter, Claude Code, Aider, Ollama)
│   ├── cli/        # Commander.js CLI
│   ├── app/        # Electron desktop app
│   └── ui/         # Shared React components
└── docs/           # PRD, architecture, design, research
```

## Providers

**OpenRouter** (primary): One API key → hundreds of models. DeepSeek, Qwen, Llama, Claude, GPT, Mistral. Cheapest path to running experiments.

**CLI agents**: Claude Code, Aider (V1). Codex CLI, Gemini CLI (V1.1). Bring your own subscriptions. These run as headless processes that Athanor orchestrates.

**Local**: Ollama (V1). Free. Good for cheap evaluation and judging.

## CLI (planned)

```bash
npm i -g athanor
athanor setup

# Providers
athanor provider add openrouter --api-key sk-or-...
athanor provider add claude-code
athanor provider add aider --model openrouter/deepseek/deepseek-chat

# Agents
athanor agent create -n "code-fixer" -p claude-code -t coding --repeatable
athanor agent run code-fixer -t "Fix failing tests in ./src"

# Experiments
athanor experiment start code-fixer -m "test-pass-rate" -v test-suite lint
athanor experiment status code-fixer
athanor experiment learnings code-fixer
```

## Support development

Athanor is free. If it becomes part of your workflow:

- [GitHub Sponsors](https://github.com/sponsors/jeffkazzee)
- [Ko-fi](https://ko-fi.com/jeffkazzee)

## License

MIT
