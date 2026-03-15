# Athanor — Implementation Plan

**Version:** 0.1
**Last updated:** 2026-03-15

---

## Objective

Ship a working alpha of Athanor — a local-first Electron app + CLI that manages AI agents with self-improving experiment loops. The alpha should prove the core thesis: that agents can measurably improve at repeatable tasks through automated baseline-vs-challenger experimentation.

---

## Phases

### Phase 1: Core engine + CLI (foundation)

**Goal:** A working CLI that can create agents, run them via OpenRouter and Claude Code, and execute a basic experiment loop with verifiers.

**Why this first:** The experiment engine is the product's soul. If it doesn't work convincingly in CLI form, wrapping it in Electron is pointless. Also, the CLI is the fastest path to a testable system.

#### Tasks

- [ ] **Storage layer**
  - SQLite schema (see ARCHITECTURE.md)
  - Drizzle ORM setup
  - Config management (read/write `~/.athanor/config.json`)
  - Credential encryption (OS keychain or encrypted file)

- [ ] **Provider registry**
  - Register/list/remove/test providers
  - Persist to SQLite
  - Wire up adapter instantiation from stored config

- [ ] **Agent CRUD**
  - Create/list/edit/delete agents
  - Persist to SQLite + filesystem (instructions file)
  - Validate against registered providers

- [ ] **Agent execution**
  - Run an agent via its provider adapter
  - Capture RunResult (output, cost, tokens, duration)
  - Store run in SQLite + artifacts on filesystem
  - Stream output to terminal

- [ ] **Verifier system**
  - Implement built-in verifiers:
    - `exit-code`: pass if exit code = 0
    - `test-suite`: run a test command, parse pass/fail count
    - `lint`: run a lint command, parse error count
    - `custom-script`: run user script, parse JSON output `{ passed, score, details }`
    - `llm-judge`: send output + rubric to LLM, parse score
  - Verifier runner: execute all verifiers for a run, return results

- [ ] **Experiment engine**
  - Create experiment on a repeatable agent
  - Baseline/challenger strategy management
  - Challenger generation via LLM (prompt with learnings context)
  - Round execution: run baseline → run challenger → score both → compare → promote/discard
  - Learning recording: extract finding, tag impact, append to learnings.md
  - Learning compression: summarize when exceeding threshold

- [ ] **CLI commands (wired to real logic)**
  - `athanor setup`
  - `athanor provider add/list/test/remove`
  - `athanor agent create/list/run/inspect/edit/delete`
  - `athanor experiment start/stop/status/history/learnings/promote`
  - `athanor config set/get`

- [ ] **Testing**
  - Unit tests for experiment engine (mock adapters)
  - Integration test: run a real experiment against OpenRouter with a simple task
  - E2E test: full CLI flow from setup to experiment round completion

**Critique checkpoint:** After this phase, run a real experiment — a coding agent that improves at a specific task (e.g., writing unit tests) over 10+ rounds. If the learnings are useful and scores trend upward, the engine works. If they're noise, the generation/evaluation loop needs rework before touching UI.

**Risk:** The challenger generation prompt is critical and hard to get right on the first try. If challengers are random rather than informed, the improvement signal will be noise. Mitigate by keeping the first challenger changes small (single-variable mutations) and validating the learning quality manually.

---

### Phase 2: Electron app (interface)

**Goal:** A desktop app that provides a visual interface for everything the CLI can do, plus an experiment dashboard with charts.

**Why now:** With the engine proven via CLI, the app is about making it accessible and providing the visual proof (charts, trends) that makes the experiment concept click for users.

#### Tasks

- [ ] **Electron shell**
  - Main process: IPC bridge, database connection, adapter management
  - Renderer process: Vite + React
  - Window management, app menu, system tray (optional)

- [ ] **UI foundation**
  - Design system implementation (see DESIGN-BRIEF.md)
  - Font loading (Syne, Satoshi, JetBrains Mono — bundled)
  - Color tokens (dark mode primary, light mode secondary)
  - Spacing scale
  - Core components: Button, Input, Card, Badge, Table, Tabs

- [ ] **Agent list (home screen)**
  - Agent cards with status indicators
  - Quick actions (run, open, edit)
  - Experiment sparkline per agent
  - Create agent flow

- [ ] **Agent detail**
  - Overview tab: instructions, config, provider
  - Runs tab: sortable table of run history
  - Settings tab: edit config

- [ ] **Experiment dashboard**
  - Score-over-time chart (the hero visualization)
  - Current round comparison (baseline vs challenger)
  - Learnings feed
  - Experiment stats (rounds, cost, improvement %)
  - Controls: start/stop/pause, configure

- [ ] **Provider settings**
  - Provider list with health status
  - Add/edit/remove providers
  - Test connection button

- [ ] **Run detail view**
  - Streaming output display (monospace)
  - Token/cost/duration stats
  - Verifier results
  - Artifact browser

- [ ] **IPC integration**
  - Main process exposes core operations via IPC
  - Renderer calls core through IPC bridge
  - Real-time updates: experiment progress, run streaming

**Critique checkpoint:** Have 3-5 people (developer friends, online community) use the app for a day. Watch where they get confused. The experiment setup flow is the most likely pain point — if defining metrics and verifiers is too complex, simplify the presets. The chart must clearly show improvement or clearly show no improvement — ambiguity is worse than a flat line.

**Risk:** Electron app performance with SQLite and child process management. Mitigate by keeping the renderer thin — all heavy work in main process, renderer only displays data via IPC.

---

### Phase 3: Polish + distribution (ship it)

**Goal:** The app is installable, documented, and ready for public GitHub release.

#### Tasks

- [ ] **Packaging**
  - electron-builder config for macOS (.dmg) and Linux (.AppImage, .deb)
  - npm publish for CLI package
  - GitHub Releases automation (tag → build → upload)
  - Auto-update mechanism (electron-updater)

- [ ] **Documentation**
  - README with install instructions, quick start, screenshots
  - Docs site (or thorough GitHub wiki) covering:
    - Getting started
    - Provider setup guides (one per provider)
    - Creating your first agent
    - Running your first experiment
    - Verifier reference
    - CLI reference
    - FAQ

- [ ] **Landing page**
  - Clear value proposition
  - Demo video or animated GIF
  - Download links (macOS, Linux, npm)
  - Donation links
  - "Why Athanor?" section

- [ ] **Community**
  - GitHub Sponsors setup
  - Ko-fi page
  - Discord or GitHub Discussions
  - Issue templates

- [ ] **QA**
  - Test on macOS (Intel + Apple Silicon)
  - Test on Linux (Ubuntu, Fedora)
  - Test CLI on all three platforms
  - Test with each V1 adapter (OpenRouter, Claude Code, Aider, Ollama)
  - Edge cases: large outputs, long-running tasks, interrupted experiments, concurrent CLI + app access

**Critique checkpoint:** Before public announcement, run the full app for a week on a real use case. Document the results. The announcement post/video needs to show real data — "I ran Athanor on X for a week and here's what happened." That's the proof.

---

### Phase 4: Growth (post-launch)

Not planned in detail, but the roadmap:

- [ ] Windows support
- [ ] Additional adapters (Codex CLI, Gemini CLI, direct API providers)
- [ ] Background daemon for experiments (runs without app open)
- [ ] Plugin/extension API for third-party verifiers and adapters
- [ ] Community learning sharing (opt-in)
- [ ] Template library (pre-built agent + experiment configs for common use cases)
- [ ] A/B/n testing (multiple simultaneous challengers)

---

## Timeline estimate

Not providing one. Timeline estimates for solo projects with novel architecture are fiction. The work is ordered by dependency and priority. Ship Phase 1 when it works, Phase 2 when it looks right, Phase 3 when it's ready for other people.

---

## Dependencies and setup

### Development environment
- Node.js 20+
- npm 10+
- TypeScript 5.8+
- SQLite (ships with better-sqlite3, no install needed)
- Git (for Aider adapter testing)

### External accounts needed for testing
- OpenRouter API key (for API adapter testing)
- Anthropic API key or Claude Pro subscription (for Claude Code adapter testing)
- Ollama installed locally (for local adapter testing)
- Aider installed (`pip install aider-chat`) for Aider adapter testing

### CI
- GitHub Actions for:
  - TypeScript build/lint on PR
  - Test suite on PR
  - Electron packaging on release tag
  - npm publish on release tag

---

## What success looks like

1. A solo developer installs Athanor, configures OpenRouter with a DeepSeek key, creates a coding agent, and runs an experiment that measurably improves the agent's test pass rate over 10 rounds. The whole thing takes under 30 minutes to set up.

2. That developer tells one other person about it because the experiment dashboard showed them something they didn't expect.

3. The experiment loop is cheap enough (via DeepSeek/Ollama) that running it overnight doesn't feel like burning money.

4. The learnings the system accumulates are actually useful — not LLM slop, but genuine insights about what works for a specific task.

That's the bar.
