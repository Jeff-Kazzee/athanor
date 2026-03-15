# Athanor — Design Brief

**Version:** 0.1
**Last updated:** 2026-03-15

---

## Identity

Athanor is the alchemist's furnace — a device designed to maintain constant, self-sustaining heat for the slow transmutation of base metals into gold. The visual identity should evoke this without being literal or kitschy.

**Mood:** Laboratory instrument. Precise, purposeful, slightly austere. Not playful, not corporate. Something you'd find in a research facility that happens to have good taste.

**Tone:** Functional craft. The kind of tool where every element earns its place. No decoration for decoration's sake.

---

## Typography

### Display / Headings
**Syne** — geometric, slightly unconventional letter shapes. Has personality without screaming. The irregular 'a' and 'g' give it a scientific-instrument quality that fits the name.

Fallback: Space Grotesk (cleaner, more conventional, still distinctive)

### Body / UI text
**Satoshi** — humanist sans with enough warmth for longer reads but tight enough for data-dense UI. Good x-height, clear at small sizes.

Fallback: Geist Sans

### Monospace / Code / Data
**JetBrains Mono** — designed for code, excellent at small sizes, good ligature support. This will carry a lot of the UI since Athanor is a developer tool.

### Hierarchy
| Level | Font | Weight | Size |
|-------|------|--------|------|
| Page title (h1) | Syne | 700 | 28px |
| Section head (h2) | Syne | 600 | 20px |
| Subsection (h3) | Satoshi | 600 | 16px |
| Body | Satoshi | 400 | 14px |
| UI label | Satoshi | 500 | 12px |
| Caption / secondary | Satoshi | 400 | 12px, 60% opacity |
| Code / data | JetBrains Mono | 400 | 13px |
| Metric value | JetBrains Mono | 600 | 18-24px |

---

## Color

### Dark mode (primary)

The primary interface. Designed, not inverted.

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Background (base) | Near-black with warm undertone | `#0D0D0F` | App background |
| Background (elevated) | Dark gray | `#16161A` | Cards, panels, sidebars |
| Background (surface) | Medium-dark | `#1E1E24` | Input fields, dropdowns, hover states |
| Border | Subtle | `#2A2A32` | Dividers, card borders |
| Text (primary) | Off-white | `#E8E6E3` | Body text, headings |
| Text (secondary) | Muted | `#8A8A96` | Labels, captions, metadata |
| Text (tertiary) | Dim | `#55555F` | Placeholders, disabled |

### Accent colors

| Role | Color | Hex | Usage |
|------|-------|-----|-------|
| Primary | Amber | `#D4A039` | CTAs, active states, experiment "running" — the furnace glow |
| Accent | Cool teal | `#3D9B8F` | Links, info states, secondary actions |
| Success | Muted green | `#4A9B6E` | Passed verifiers, promotions, wins |
| Warning | Warm orange | `#C47830` | Budget warnings, approaching limits |
| Error | Muted red | `#B54B4B` | Failed verifiers, errors, losses |
| Neutral highlight | Blue-gray | `#4A6B8A` | Selected items, focus rings |

### Light mode (secondary)

Available but secondary. Not just inverted dark mode.

| Role | Color | Hex |
|------|-------|-----|
| Background (base) | Warm white | `#F5F3F0` |
| Background (elevated) | White | `#FFFFFF` |
| Background (surface) | Light gray | `#ECEAE6` |
| Border | Soft | `#D9D6D0` |
| Text (primary) | Near-black | `#1A1A1F` |
| Text (secondary) | Medium gray | `#6B6B75` |

Accent colors stay the same but adjust saturation/lightness for contrast compliance.

### Why amber

The primary accent is amber — the color of heated metal, of furnace glow, of alchemical gold. It ties directly to the Athanor name without being on-the-nose. It also has strong contrast against both dark and light backgrounds, works for both success states and active/running states, and avoids the blue-purple SaaS gradient trap.

---

## Spacing

4px base scale: 4, 8, 12, 16, 24, 32, 48, 64, 96

| Token | px | Usage |
|-------|-----|-------|
| `space-1` | 4 | Tight: icon padding, inline gaps |
| `space-2` | 8 | Default: between related elements |
| `space-3` | 12 | Between form fields, list items |
| `space-4` | 16 | Card padding, section margins |
| `space-6` | 24 | Between sections |
| `space-8` | 32 | Between major sections |
| `space-12` | 48 | Page margins |
| `space-16` | 64 | Hero spacing |

---

## Layout principles

### Information density
This is a power-user tool. Optimize for density over whitespace. Data should be visible, not hidden behind accordions or modals. But dense ≠ cramped — the spacing scale keeps things readable.

### Navigation
- Left sidebar: agent list, navigation
- Main panel: current view (agent detail, experiment dashboard, run output)
- Right panel (optional/collapsible): context, learnings, config
- Bottom panel (optional/collapsible): terminal output, logs

### Grid
Single-column primary content area. The sidebar is fixed-width (240-280px). Cards and data displays use a responsive grid within the main panel.

### Asymmetry
The layout should not be symmetrically centered. Content should align left, with intentional use of asymmetric spacing to create visual interest and clear reading flow. Data visualizations (experiment score charts) can break the grid.

---

## Key screens

### 1. Agent list (home)
The default view. Shows all agents as a dense list or card grid.

Each agent shows:
- Name + description (one line)
- Provider badge (icon + model name)
- Job type tag
- Last run: time, cost, score (if experiment-enabled)
- Experiment status: inactive / running / paused (with sparkline of recent scores)
- Quick actions: Run, Open, Edit

### 2. Agent detail
Full view of a single agent.

Tabs:
- **Overview** — instructions, config, provider, schedule
- **Runs** — table of all runs with sortable columns (time, cost, tokens, score, exit code)
- **Experiments** — experiment config, chart, rounds table, learnings
- **Settings** — edit agent config

### 3. Experiment dashboard
The most important screen. Shows the evolution of an experiment over time.

Components:
- **Score chart** — line chart of baseline vs challenger scores over rounds. The trend line is the proof that the system works.
- **Current round** — side-by-side comparison of baseline and challenger (instructions diff, scores, verifier results)
- **Learnings feed** — scrollable list of findings, tagged by impact (positive/negative/neutral)
- **Stats** — total rounds, total cost, best score, improvement percentage, win/loss ratio
- **Controls** — start/stop/pause, promotion rules, budget settings

### 4. Provider settings
List of configured providers with health check status.

Each provider shows:
- Kind + name
- Model (if set)
- Health status (green/red dot)
- Last used
- Total spend (if trackable)
- Actions: test, edit, remove

### 5. Run detail
Full output of a single run.

Shows:
- Streaming output (monospace, syntax-highlighted where possible)
- Token usage breakdown
- Cost
- Duration
- Verifier results (pass/fail badges with detail expandable)
- Artifacts (file browser)

---

## Component style notes

### Buttons
- Primary: amber background, dark text. Slightly rounded (4px radius). No shadow.
- Secondary: transparent, bordered, text in primary color.
- Ghost: no border, text only, subtle hover background.
- Destructive: muted red, same shape as primary.

### Cards
- Elevated background (`#16161A`), subtle border (`#2A2A32`), 8px radius.
- No shadow. Elevation communicated through background color difference only.
- Cards should feel like panels in an instrument, not floating paper.

### Input fields
- Surface background (`#1E1E24`), 1px border, 4px radius.
- Focus: amber ring (1px, 50% opacity).
- Monospace font for any field that accepts code, paths, or technical values.

### Charts
- Line charts for experiment scores. Minimal decoration.
- Amber line for challenger, teal for baseline.
- Grid lines very subtle (10% opacity).
- No animation on load. Static display of real data.

### Status indicators
- Small colored dot (8px) with label. No icons for status — dots are faster to scan.
- Running: amber, pulsing very slowly (not fast — not anxious)
- Success: green, static
- Error: red, static
- Paused: neutral, static
- Inactive: dim, static

### Toast / notifications
- Bottom-right, small, auto-dismiss after 5s.
- Dark surface background, subtle border.
- No sound. No bounce. No celebration animation. Just information.

---

## Anti-patterns (things to avoid)

- No generic gradients anywhere
- No rounded-everything (brutalist-adjacent flat panels are better here)
- No emoji in the UI
- No "AI sparkle" icon (✨) or any visual that implies magic
- No loading spinners with cute messages ("Thinking...", "Brewing knowledge...")
- No onboarding tour / walkthrough overlay
- No marketing language in the UI itself (save it for the website)
- No skeleton screens — show real loading states (progress bar or spinner, then content)
- No blur/glassmorphism effects
- No animations longer than 200ms

---

## Fonts loading strategy

All three typefaces (Syne, Satoshi, JetBrains Mono) should be bundled with the Electron app — no external font loading. For the website/landing page, use `@font-face` with `font-display: swap` and self-hosted files.

Sources:
- Syne: Google Fonts (OFL license, self-host)
- Satoshi: Fontshare (free for commercial use, self-host)
- JetBrains Mono: JetBrains (OFL license, self-host)

---

## Open design questions

1. **Logo/icon:** Need a mark for the app icon, favicon, and GitHub. Should evoke the furnace concept without being a literal furnace illustration. Geometric, minimal. Could explore: stylized flame, alchemical symbol, abstract vessel shape.

2. **Sidebar behavior:** Fixed or collapsible? On a small screen, should it collapse to icons or hide completely?

3. **Experiment chart type:** Line chart is the obvious choice for score-over-time. But are there better visualizations for showing the improvement story? (e.g., waterfall chart showing each round's delta, or a dot plot showing all strategies with the promoted ones highlighted)
