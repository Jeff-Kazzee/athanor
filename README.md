# Athanor

A local-first AI agent manager where agents get measurably better at their jobs over time.

Athanor runs baseline-vs-challenger experiments on your agents, scores results with real verifiers, promotes winners, and accumulates learnings. The experiment engine is the differentiator — but the product is a general-purpose agent tool that works without it.

**Free and open source.** Your data stays on your machine. Bring your own API keys and CLI subscriptions.

## Status

Early development. The type system and adapter contracts are in place. CLI stubs exist. The Electron app is next.

## Install (when ready)

```bash
npm i -g athanor
```

## CLI

```bash
# Providers
athanor provider add openrouter --api-key sk-or-...
athanor provider add claude-code
athanor provider add aider --model openrouter/deepseek/deepseek-chat
athanor provider list
athanor provider test openrouter

# Agents
athanor agent create -n "code-fixer" -p claude-code -t coding --repeatable
athanor agent run code-fixer -t "Fix failing tests in ./src"
athanor agent list

# Experiments
athanor experiment start code-fixer -m "test-pass-rate" -v test-suite lint
athanor experiment status code-fixer
athanor experiment history code-fixer
athanor experiment learnings code-fixer
```

## Architecture

Turborepo monorepo with four packages:

| Package | What |
|---------|------|
| `@athanor/core` | Types, schemas, experiment engine, storage |
| `@athanor/adapters` | Provider adapters (OpenRouter, Claude Code, Aider, more) |
| `athanor` (cli) | Commander.js CLI for headless operation |
| `@athanor/app` | Electron desktop app |
| `@athanor/ui` | Shared React components |

## Providers

**API (via OpenRouter):** One key, hundreds of models — DeepSeek, Qwen, Llama, Claude, GPT, Mistral, and more. Cheapest path to running experiments.

**CLI agents:** Claude Code, Codex CLI, Gemini CLI, Aider. Bring your own subscriptions. These run as headless processes that Athanor orchestrates.

**Local:** Ollama, LM Studio, llama.cpp. Free. Good for cheap evaluation and judging.

## How experiments work

1. You define an agent with a repeatable job
2. You set a metric and verifiers (test suite, lint, LLM judge, API query, custom script)
3. Athanor runs the current baseline strategy
4. It generates a challenger variant (different prompt, different approach)
5. Both run against the same task, scored by verifiers
6. Winner stays. Learnings accumulate.
7. Next challenger is informed by everything the system has learned
8. Repeat. Your agent gets better.

## Support development

Athanor is free. If it becomes part of your workflow, consider supporting it:

- [GitHub Sponsors](https://github.com/sponsors/jeffkazzee)
- [Ko-fi](https://ko-fi.com/jeffkazzee)

## License

MIT
