# Athanor — Competitive Landscape

**Version:** 0.1
**Last updated:** 2026-03-15

Where Athanor sits relative to existing tools, and why the gap it fills is real.

---

## Adjacent tools (not direct competitors, but related)

### Karpathy's autoresearch
**What it is:** A minimal experiment loop for ML training. Change hyperparameters, train for 5 min, check validation loss, keep or discard, repeat.

**What Athanor takes from it:** The core loop pattern (hypothesis → experiment → measure → learn → repeat). The insight that tight feedback loops compound faster than slow ones.

**Where Athanor differs:** autoresearch is one file, one metric, one domain (ML training). Athanor generalizes this to arbitrary agent tasks with pluggable verifiers and multiple provider backends.

---

### ACE Platform (DannyMac180/ace-platform)
**What it is:** Agent Computer Environment — versioned playbooks, outcome logging, MCP integration, automatic evolution of instructions from usage history.

**What it does well:** The playbook versioning and evolution concepts are sound. The reflector/curator pipeline that rewrites playbooks from usage is genuinely useful.

**The gap:** ACE evolves instructions from qualitative outcome notes. Athanor evolves strategies from quantitative experiment results with verifier-backed scoring. They're cousins, not competitors.

**Important constraint found in the repo:** ACE's evolution backend only instantiates an OpenAI client despite config suggesting broader provider support. Provider abstraction is not fully implemented. This is relevant if considering ACE integration — would need patches for non-OpenAI providers.

---

### DSPy
**What it is:** A framework that treats prompt optimization as a first-class programming step. Tunes prompts, demos, and finetuning paths against a metric using optimizers (BootstrapFewShot, MIPRO, etc.).

**What Athanor learns from it:** The discipline of "optimize only where you have a metric and a training set." DSPy's optimizers are more rigorous than "ask an LLM to generate a variant" — they use actual optimization algorithms.

**Where Athanor differs:** DSPy is a Python library for developers building LLM pipelines. Athanor is a desktop app for managing agents. Different audiences, different UX expectations. But Athanor's challenger generation could borrow DSPy-style optimization strategies in future versions.

---

### Promptbreeder (DeepMind, 2023)
**What it is:** Research paper showing that prompts and even mutation prompts can evolve in a self-referential loop. Prompt mutations are scored against a fitness function, and winners are kept.

**What Athanor learns from it:** Self-referential improvement is possible but dangerous. The fitness function must be real and the search space bounded, or the system generates increasingly weird prompts that game the metric.

**Key lesson:** Don't let the system optimize its own evaluation criteria. The verifiers must be human-defined and stable.

---

### Promptfoo
**What it is:** Open-source eval framework. Run prompts against test cases, compare outputs, grade with assertions or LLM judges. CI integration, local execution, red teaming.

**What it does well:** Repeatable testing of prompt variants. Clear pass/fail reporting. Good developer UX.

**The gap:** Promptfoo is an eval tool, not an agent manager. It tests prompts but doesn't run agents, doesn't manage experiments over time, doesn't accumulate learnings, doesn't drive a continuous improvement loop. Athanor's verifier system could wrap Promptfoo as a verifier backend.

---

### Braintrust
**What it is:** Platform for evals, tracing, and logging in AI products. Dashboard for comparing prompt performance, A/B testing, monitoring production AI.

**What Athanor learns from it:** The market values observability + scoring more than magical autonomy. People will pay for "I can see what my AI is doing and whether it's getting better" before they'll pay for "my AI improves itself."

**Where Athanor differs:** Braintrust is a SaaS platform for teams. Athanor is a local tool for individuals. Braintrust focuses on monitoring production AI; Athanor focuses on improving development-time agent workflows.

---

## Desktop agent tools (more direct competition)

### Claude Code / Cursor / Windsurf / Cline
These are AI coding assistants. They run agents for coding tasks. But none of them have:
- Experiment loops
- Baseline-vs-challenger testing
- Accumulated learnings that improve future runs
- Verifier-scored results with promotion rules

They're the agents that Athanor manages, not competitors to Athanor itself. Athanor wraps them via adapters.

### Aider
Aider is both a competitor and a provider. As a standalone tool, it's a CLI coding agent. As an Athanor adapter, it's a runtime that Athanor orchestrates.

The key Aider feature that Athanor leverages: git-native change tracking. Every Aider run produces a git diff, which is a natural artifact for verifier scoring.

---

## Where Athanor is genuinely novel

No existing tool combines all of:

1. **General-purpose agent management** (create, configure, run agents for any task type)
2. **Automated experimentation** (baseline vs challenger with real scoring)
3. **Accumulated learnings** (context that makes each iteration smarter)
4. **Provider-agnostic** (works with any LLM API, CLI agent, or local model)
5. **Local-first** (no cloud dependency, no accounts, no telemetry)
6. **Free and open source**

Individual pieces exist. The combination doesn't — at least not in a form that a solo developer can install via npm and start using in 30 minutes.

---

## Market position

Athanor is not competing with:
- Enterprise AI platforms (too small, too opinionated)
- AI coding assistants (it wraps them, doesn't replace them)
- Prompt engineering tools (it includes that capability but isn't limited to it)

Athanor is competing for:
- The developer who uses Claude Code or Aider daily and wants their agents to get better at recurring tasks
- The developer who runs the same kind of task repeatedly and is tired of manually tweaking prompts
- The developer who wants proof (charts, data) that their AI workflow is improving, not just vibes

The pitch, in one line:
**"Your agents should learn from every run. Athanor makes them."**
