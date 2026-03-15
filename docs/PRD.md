# Athanor — Product Requirements Document

**Version:** 0.1
**Last updated:** 2026-03-15
**Author:** Jeff Kazzee + Claude

---

## Name

**Athanor** — from the alchemist's furnace designed to maintain a constant, self-sustaining heat for transmutation. The metaphor is precise: a system that keeps refining autonomously, turning base attempts into refined outcomes through sustained experimentation.

npm package: `athanor` (available)
CLI command: `athanor`
Repo: https://github.com/Jeff-Kazzee/athanor

---

## Objective

A local-first, free, donation-supported Electron app + CLI for running AI agents on your machine. The thing that makes it different from every other agent wrapper: **agents run experiments on themselves and get measurably better at their jobs over time.**

Not "self-improving AI" as marketing fluff. Actual baseline-vs-challenger testing, with real metrics, promotion rules, and accumulated learnings. The experiment engine is the differentiator, but the product is a general-purpose agent tool.

---

## What it is

- **Electron desktop app** — the main interface for creating, managing, and monitoring agents
- **CLI tool** (`npx athanor` or `npm i -g athanor`) — for setup, config, running agents headlessly, managing providers, and scripting
- **Local-first** — all data stays on your machine. No accounts, no telemetry, no cloud dependency
- **Free + donations** — Obsidian/Signal model. Good enough that people want to support it

## What it is not

- Not a SaaS
- Not a hosted agent platform
- Not another ChatGPT wrapper
- Not a prompt playground

---

## Core concepts

### 1. Agents

An agent is a configured AI worker for a specific job. It has:

- **Name and description** — human-readable identity
- **Provider** — which model/CLI/API powers it
- **Job type** — what kind of work it does (coding, content, extraction, automation, research, custom)
- **Instructions** — system prompt, playbook, skill file, or task template
- **Tools** — what the agent can access (filesystem, browser, APIs, MCP servers, shell)
- **Schedule** — optional: run on interval, on file change, on webhook, or manually
- **Repeatable flag** — whether this agent does the same kind of job repeatedly (required for experiments)

This part alone makes it a useful agent manager. People can use Athanor without ever touching experiments.

### 2. Experiments (the differentiator)

Any repeatable agent can be put into experiment mode. This is where Athanor diverges from every other agent tool.

An experiment consists of:

- **Baseline** — the current best-known strategy/prompt/config for a job
- **Challenger** — a variant the system generates or the user proposes
- **Metric** — what success looks like (test pass rate, schema match, cost, latency, LLM judge score, custom script output, API response metric)
- **Verifiers** — one or more scoring mechanisms:
  - **Hard checks:** exit code, test suite, lint, typecheck, schema validation
  - **Graded checks:** LLM judge with rubric, pairwise comparison
  - **External metrics:** API query (reply rate, conversion rate, CTR)
  - **Cost/time guards:** budget ceiling, runtime limit
  - **Custom:** user-provided scoring script (any language, returns JSON)
- **Promotion rule** — when does a challenger become the new baseline?
  - Score threshold (challenger beats baseline by X%)
  - Win streak (challenger wins N consecutive rounds)
  - Manual approval (human reviews before promotion)
  - Auto-best (always promote the higher scorer)

**The experiment loop:**
```
1. Run baseline strategy on task
2. Generate or load challenger variant
3. Run challenger on same task (or parallel task)
4. Score both with verifiers
5. Log results + artifacts
6. If challenger wins → promote to new baseline, record learnings
7. If challenger loses → discard, record why it failed
8. Generate next challenger informed by ALL accumulated learnings
9. Repeat
```

The key insight from Karpathy's autoresearch: this works when three conditions hold:
- Feedback is fast (minutes, not days)
- Scoring is objective or at least stable
- The agent can actually change the thing being tested

### 3. Learnings

Every experiment round produces learnings. These accumulate in a local knowledge base per agent:

- What worked and why (with evidence: scores, diffs, artifacts)
- What failed and why
- Patterns that consistently improve scores
- Anti-patterns to avoid
- Cost and performance trends over time

This is the `resource.md` concept from Nick Zareyev's video, but structured and queryable. New challengers are generated with full context of past experiments. The agent gets measurably better at its job over time — and you can see the proof.

### 4. Providers

Users bring their own everything. Athanor is provider-agnostic.

**Primary API provider — OpenRouter:**
- One API key, hundreds of models
- OpenAI-compatible request format (drop-in replacement)
- Access to DeepSeek, Qwen, Llama, Claude, GPT, Mistral, Cohere, and more
- Pass-through pricing to underlying providers
- Free models available for experimentation
- This is the recommended default for most users

**CLI-based agent runtimes** (user's own subscription):
- Claude Code — best structured output (`--print --output-format json`), full coding agent
- Aider — most flexible model routing (works with any LLM via API or OpenRouter), git-native change tracking
- Codex CLI — `--approval-mode full-auto` for headless operation, open source
- Gemini CLI — Google auth, free tier available, newer but capable

**Local providers** (free):
- Ollama
- LM Studio
- Any OpenAI-compatible local endpoint

**V1 scope:** OpenRouter (API) + Claude Code (CLI) + Aider (CLI). Others added based on demand.

---

## User experience

### First run (CLI)
```bash
npm i -g athanor
athanor setup
```

Setup wizard walks through:
1. Pick a provider (or skip, add later)
2. Enter API key or authenticate CLI tool
3. Done. App opens (or CLI confirms setup).

### First run (Electron)
1. Download from GitHub releases or website
2. App opens to setup wizard
3. Same flow: pick provider, enter key, go

### Creating an agent

**In the app:**
1. Click "New Agent"
2. Name it, describe what it does
3. Pick a provider and model
4. Write instructions (or import a file — skill file, playbook, markdown)
5. Optionally: define tools, schedule, working directory
6. Toggle "Repeatable" if this agent does the same kind of job repeatedly
7. Save → agent is ready to run

**Via CLI:**
```bash
athanor agent create \
  --name "code-fixer" \
  --provider claude-code \
  --type coding \
  --instructions-file ./fix-instructions.md \
  --working-dir ./my-project \
  --repeatable
```

### Running an agent

**In the app:**
- Click "Run" on any agent → streams output in real time
- Results logged with cost, time, tokens used
- Artifacts saved locally and browsable

**Via CLI:**
```bash
athanor agent run code-fixer --task "Fix failing tests in ./src"
```

### Enabling experiments

**In the app:**
1. On any repeatable agent, click "Experiments" tab
2. Define metric (pick from presets or write custom)
3. Add verifiers (drag from a list or configure custom script)
4. Set promotion rules (threshold, win streak, manual gate)
5. Set schedule (every N minutes, every N hours, on-demand)
6. Toggle "Active" → experiment loop begins
7. Dashboard shows: score trend, cost per run, current baseline vs challenger, accumulated learnings

**Via CLI:**
```bash
athanor experiment start code-fixer \
  --metric "test-pass-rate" \
  --verifier test-suite \
  --verifier lint \
  --promotion-rule score-threshold \
  --threshold 0.6 \
  --schedule "*/30 * * * *"

athanor experiment status code-fixer
athanor experiment history code-fixer
athanor experiment learnings code-fixer
athanor experiment promote code-fixer
athanor experiment stop code-fixer
```

### Full CLI reference
```bash
# Setup
athanor setup                          # First-time setup wizard
athanor config set <key> <value>       # Set config values
athanor config get <key>               # Read config values

# Providers
athanor provider add <kind>            # Add provider (openrouter, claude-code, aider, ollama)
  --api-key <key>                      # API key
  --model <model>                      # Default model
  --name <name>                        # Display name
  --base-url <url>                     # Custom endpoint
  --cli-path <path>                    # Path to CLI binary
athanor provider list                  # List configured providers
athanor provider test <name>           # Test connection
athanor provider remove <name>         # Remove provider
athanor provider models <name>         # List available models

# Agents
athanor agent create                   # Create agent (flags above)
athanor agent list                     # List all agents
athanor agent run <name>               # Run agent
  --task <task>                        # Inline task
  --task-file <file>                   # Task from file
  --dry-run                            # Preview without executing
athanor agent inspect <name>           # Show config, history, stats
athanor agent edit <name>              # Modify agent config
athanor agent delete <name>            # Delete agent

# Experiments
athanor experiment start <agent>       # Start experiment
athanor experiment stop <agent>        # Stop experiment
athanor experiment status [agent]      # Status (all or specific)
athanor experiment history <agent>     # Round-by-round history
athanor experiment learnings <agent>   # Accumulated learnings
athanor experiment promote <agent>     # Manual promotion
athanor experiment export <agent>      # Export experiment data as JSON

# Aliases
athanor exp = athanor experiment
```

---

## Job type examples

### Coding tasks
- **Metric:** test pass rate, typecheck, lint score
- **Verifiers:** jest/vitest, tsc, eslint, diff size
- **What changes:** task decomposition strategy, system prompt, tool selection
- **Feedback loop:** 5-15 min per round
- **Why it works:** outputs are diffable, tests are cheap, failure is visible

### Content generation
- **Metric:** LLM judge score against rubric, readability score
- **Verifiers:** rubric judge, word count, tone checker
- **What changes:** writing style instructions, structure templates, examples
- **Feedback loop:** 1-2 min per round

### Cold email copy (the video example)
- **Metric:** reply rate (queried from API like Instantly)
- **Verifiers:** API metric query, word count, spam score
- **What changes:** email copy, subject line, CTA
- **Feedback loop:** hours to days (needs real sends and real replies)
- **Note:** slower loop means fewer experiments per day, so each one matters more

### Data extraction / scraping
- **Metric:** schema match rate, field accuracy
- **Verifiers:** JSON schema validation, sample spot-checks
- **What changes:** extraction prompts, parsing logic
- **Feedback loop:** seconds per round (fastest loop of all job types)

### Skill file / playbook optimization
- **Metric:** downstream task success rate
- **Verifiers:** task-specific checks, LLM judge
- **What changes:** skill file content, instructions, examples, tool selection
- **Feedback loop:** depends on the downstream task
- **Note:** this is meta-optimization — using Athanor to improve the instructions that Athanor agents use

### Landing page / CRO
- **Metric:** conversion rate (queried from analytics API)
- **Verifiers:** API metric query, page load speed, accessibility score
- **What changes:** copy, layout, CTA placement
- **Feedback loop:** hours to days (needs traffic)

---

## Revenue model

**Free tool. Donations only.**

- GitHub Sponsors
- Ko-fi or Buy Me a Coffee
- Optional: "Supporter" badge in app for donors (cosmetic only, zero feature gating)

Target: $500-600/mo from a base of ~2000+ active users.

### Why this can work
- Zero hosting costs (local-first, no servers)
- Zero support burden from paying customers expecting uptime
- Distribution through GitHub, npm, Hacker News, dev communities, YouTube
- The experiment feature is genuinely novel in the desktop agent tool space
- Donation-supported tools work when the tool becomes part of someone's daily workflow (see: Obsidian, Signal, Wikipedia)

### Revenue diversification
Donations alone may not hit $500-600/mo quickly. Parallel lanes:
1. Free tool builds reputation + portfolio piece
2. Reputation drives freelance/consulting leads (the real short-term income path)
3. Donations grow as user base grows organically
4. Potential future: premium templates, curated verifier packs, or a hosted leaderboard for sharing experiment results (only if demand exists)

---

## Distribution

- **npm:** `npm i -g athanor` (CLI + optional Electron launcher)
- **GitHub Releases:** downloadable Electron app for macOS and Linux
- **GitHub:** open source, MIT license
- **Homebrew:** `brew install athanor` (stretch goal, post-v1)
- **Website:** landing page with download links, docs, donation link, demo video

---

## Platform support

**V1:** macOS and Linux
**V1.1:** Windows (Electron handles this, but CLI agent adapters need Windows testing)

---

## Open questions (to resolve before implementation)

1. **A/B vs A/B/n:** Should experiments support multiple challengers simultaneously, or just one at a time? Single challenger is simpler and clearer. Multiple challengers find winners faster but cost more per round.

2. **Plugin system:** Do we want a formal plugin/extension API for custom verifiers and adapters? Or is "write a script that returns JSON" good enough for v1? Leaning toward scripts-first, plugin API later.

3. **Experiment scheduling:** Should the experiment loop be driven by the Electron app's process (dies when app closes), by a background daemon, or by the user's own cron/scheduler? Daemon is more reliable. App-only is simpler.

4. **Strategy generation:** How does the system generate challengers? Options:
   - LLM generates a modified version of the baseline instructions (default)
   - User provides a list of variants to test
   - System uses a mutation strategy (change one thing at a time)
   - Combination: LLM proposes, but constrained to single-variable changes

5. **Context window management:** As learnings accumulate (hundreds of rounds), the learning document gets large. When do we summarize/compress? After N rounds? When it exceeds N tokens? Should old learnings be archived but still searchable?

---

## Definition of done (v1)

- [ ] Electron app installs and runs on macOS and Linux
- [ ] CLI installs via `npm i -g athanor`
- [ ] User can add at least 2 providers (OpenRouter + one CLI agent)
- [ ] User can create and run an agent for a basic task
- [ ] User can enable experiments on a repeatable agent
- [ ] Experiment loop runs: baseline → challenger → score → promote/discard → learn → repeat
- [ ] Dashboard shows baseline vs challenger scores over time as a chart
- [ ] Learnings accumulate per agent and inform challenger generation
- [ ] All data stored locally in SQLite + filesystem, no cloud calls except to user's providers
- [ ] Donation link visible but non-intrusive in app
- [ ] README, landing page, and npm package published
- [ ] At least one real end-to-end demo: a coding agent that measurably improves at a task over 10+ experiment rounds
