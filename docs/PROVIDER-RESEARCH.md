# Athanor — Provider Research

**Version:** 0.1
**Last updated:** 2026-03-15

Research into the provider ecosystem Athanor needs to support. Focuses on what matters for wrapping these as automation adapters.

---

## OpenRouter (Primary API Provider)

OpenRouter is the recommended default for Athanor. One API key gives access to hundreds of models from every major provider.

### Key facts
- **Base URL:** `https://openrouter.ai/api/v1`
- **Auth:** Bearer token via `Authorization: Bearer <key>` header
- **Format:** Fully OpenAI-compatible. Drop-in replacement for the OpenAI SDK — change `baseURL` and `apiKey`, everything else works.
- **Model listing:** `GET /api/v1/models` (no auth required) returns all available models with IDs, pricing, and context lengths.
- **Pricing:** Pass-through to underlying providers with a small markup. Per-token billing. Some models are free (rate-limited).
- **Headers:** Optional `X-Title` (app name) and `HTTP-Referer` (app URL) for attribution.

### Model access
All major families available:
- **DeepSeek:** deepseek-chat, deepseek-coder, DeepSeek-V3, R1 — *cheapest option for experimentation*
- **Qwen:** qwen-2.5 series at various sizes
- **Llama:** llama-3.1 up to 405B
- **Claude:** claude-3.5-sonnet, claude-3-opus, claude-4 series
- **GPT:** gpt-4o, gpt-4-turbo, o1 series
- **Mistral, Cohere, and dozens more**

### Why it's the primary adapter
- One integration covers the entire model ecosystem
- Users only need one API key
- Cheapest models (DeepSeek, free tiers) are ideal for experiment rounds where you're running many iterations
- OpenAI-compatible means the adapter code is minimal

### Adapter implementation notes
- Use the `openai` npm package with custom `baseURL`
- Model IDs use format `provider/model-name` (e.g., `deepseek/deepseek-chat`)
- Cost comes back in response headers (`x-openrouter-*`) — need to capture these
- Token counts in standard `usage` field

---

## CLI Agent Runtimes

These are coding agents that users run with their own subscriptions. Athanor wraps them as provider adapters, spawning them as child processes.

### Claude Code

**The best-structured option for automation.**

| Aspect | Detail |
|--------|--------|
| Auth | `ANTHROPIC_API_KEY` env var, or `claude login` (interactive OAuth) |
| Headless mode | `--print` flag: single prompt in, result out, exit |
| Task input | CLI arg: `claude -p "task"` or stdin: `echo "task" \| claude -p` |
| Structured output | `--output-format json` → `{ result, cost_usd, input_tokens, output_tokens, duration_ms, session_id }` |
| Model selection | `--model` flag |
| Tool control | `--allowedTools`, `--disallowedTools` flags |
| Rate limits | Bound by Anthropic API tier (RPM/TPM). Max subscription has higher ceilings. |
| Cost tracking | Built-in, returned in JSON output |
| Exit code | 0 = success, non-zero = error |

**Adapter pattern:**
```bash
claude --print --output-format json --model claude-sonnet-4-6 "your task"
```
Parse JSON from stdout. Cost, tokens, duration all included.

**Why it's a V1 adapter:** Best structured output of any CLI agent. JSON output with cost tracking means we get clean `RunResult` data with minimal parsing.

---

### Aider

**Most flexible model routing. Git-native change tracking.**

| Aspect | Detail |
|--------|--------|
| Auth | Any LLM API key via env vars: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, etc. |
| Headless mode | `--message "task" --yes` — process task and exit, auto-confirm all changes |
| Task input | `--message "task"` or `--message-file path/to/task.txt` |
| File targeting | Positional args: `aider main.py utils.py --message "refactor"` |
| Structured output | No native JSON. Use `git diff` after run to capture changes. `--show-cost` prints cost. |
| Model selection | `--model` flag, supports `openrouter/provider/model` format |
| Auto-commits | Default on (creates git commits per change). Disable with `--no-auto-commits`. |
| Self-correction | `--lint-cmd` and `--test-cmd` flags: runs linter/tests after edits and auto-fixes failures |
| Config | `.aider.conf.yml` for defaults |
| Rate limits | Bound by underlying provider |

**Adapter pattern:**
```bash
aider --yes --no-auto-commits --no-suggest-shell-commands --show-cost \
  --model openrouter/deepseek/deepseek-chat \
  --message "your task" \
  file1.py file2.py
```
Capture stdout for output. Parse cost from `--show-cost` output. Use `git diff` to see exactly what changed.

**Why it's a V1 adapter:** Works with any model via OpenRouter. Git-based change tracking is a natural artifact system. Built-in lint/test integration aligns perfectly with the verifier concept.

---

### Codex CLI (OpenAI)

| Aspect | Detail |
|--------|--------|
| Auth | `OPENAI_API_KEY` env var |
| Headless mode | `--approval-mode full-auto` skips all approval prompts |
| Task input | Positional arg: `codex "your task"` |
| Structured output | No native JSON. Text stdout only. |
| Model selection | `--model` flag (default: o4-mini) |
| Sandboxing | Supports network-disabled Docker or macOS seatbelt |
| Rate limits | Bound by OpenAI API tier |
| License | Apache 2.0 (open source) |

**Adapter pattern:**
```bash
codex --approval-mode full-auto --quiet "your task"
```

**V1 status:** Planned but not V1. Less structured output than Claude Code makes it harder to extract clean `RunResult` data.

---

### Gemini CLI

| Aspect | Detail |
|--------|--------|
| Auth | `gcloud auth login` or `GOOGLE_API_KEY` env var |
| Headless mode | `-y` / `--auto-approve`, pipe via stdin |
| Task input | Positional arg or stdin pipe |
| Structured output | Limited in early versions |
| Model selection | Default Gemini 2.5 Pro |
| Free tier | Yes, generous but rate-limited |
| Rate limits | Per-minute and per-day limits on free tier |

**V1 status:** Planned but not V1. Newer tool, less battle-tested for automation. Google auth flow is more complex than API key for headless environments.

---

### GitHub Copilot CLI

**NOT SUITABLE as an agent runtime.**

Copilot CLI (`gh copilot suggest`, `gh copilot explain`) is a command suggestion tool, not a coding agent. It does not edit files, run code, or perform multi-step tasks. It suggests terminal commands.

Dropped from the adapter roadmap.

---

### Continue.dev

**NOT SUITABLE as an agent runtime.**

Continue.dev is an IDE extension (VS Code, JetBrains). There is no standalone CLI. It operates as an in-editor agent, not a command-line tool.

Dropped from the adapter roadmap.

---

## Local Providers

### Ollama

| Aspect | Detail |
|--------|--------|
| API | OpenAI-compatible at `http://localhost:11434/v1` |
| Auth | None (local) |
| Models | User pulls models: `ollama pull llama3.1`, `ollama pull deepseek-coder`, etc. |
| Cost | Free |
| Structured output | Standard OpenAI chat completions format |

**Adapter:** Same as OpenRouter adapter with `baseURL` pointed at localhost. Near-zero implementation effort.

**V1 status:** V1 adapter. Free option for users who want to run experiments with no API costs. Good for evaluation/judging (cheap pairwise scoring with a small model).

### LM Studio

Same pattern as Ollama — OpenAI-compatible local API. Different default port. Same adapter with different `baseURL`.

**V1 status:** Post-V1. Ollama covers the local provider need.

---

## Provider strategy summary

### V1 adapters (ship with these)
1. **OpenRouter** — primary API provider, covers all commercial models
2. **Claude Code** — best CLI agent for automation (structured JSON output)
3. **Aider** — most flexible CLI agent (any model, git-native)
4. **Ollama** — free local option

### V1.1 adapters (add based on demand)
5. Codex CLI
6. Gemini CLI
7. Direct Anthropic API
8. Direct OpenAI API
9. LM Studio

### Dropped
- GitHub Copilot CLI (not a coding agent)
- Continue.dev (no CLI)

---

## Cost considerations for experiments

Running experiments means running the same task multiple times. Cost matters.

### Cheapest paths (for experiment iterations)
1. **Ollama + local model:** Free. Best for evaluation/judging, less capable for complex generation.
2. **OpenRouter + DeepSeek:** ~$0.14/M input, $0.28/M output tokens. Extremely cheap for experimentation.
3. **OpenRouter + Qwen:** Similar pricing to DeepSeek.
4. **OpenRouter + free models:** Some models are free with rate limits. Good for low-volume experiments.

### Recommended cost pattern
- Use cheap models (DeepSeek via OpenRouter, or Ollama) for:
  - Challenger generation
  - LLM judge evaluation
  - Learning summarization
- Reserve expensive models (Claude, GPT-4) for:
  - Actual task execution when quality matters
  - Final validation of promoted strategies
  - Complex verifier rubrics

### Budget enforcement
The experiment engine should enforce per-round and per-experiment budgets. If a round exceeds the configured budget, the experiment pauses and logs a warning. This prevents runaway costs during overnight autonomous operation.
