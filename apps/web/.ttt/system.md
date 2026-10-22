# System

How Cumulus is set up. The rules every TTT design system follows live in the kit, not here.

| | |
|---|---|
| **Versions** | schema `ttt-ds/1` · profile `shadcn` 1.12 · kit 0.28.21 |
| **Editors** | Angelli Dimatulac — anyone with edit access can update it; add more from its Share menu |
| **Code** | `https://github.com/angellittt/kit-sandbox-care-bear-wfm` · config `.ttt/design-system.json` |
| **Figma** | [Cumulus — Design System](https://www.figma.com/design/myRs4dMAZVLRZO65IRgUZ1) · key `myRs4dMAZVLRZO65IRgUZ1` |
| **Tracker** | https://app.clickup.com/8593845/v/l/li/901115605177 |
| **Components** | 0 implemented · 38 validated |
| **Guide** | [How to use the design system kit](https://claude.ai/artifact/CXAdV2SCptjbrijSaaUpPz): what Setup asks, and which command to run when, for designers and devs |

**Cumulus-specific choices** — client extensions, client-added ramps and decisions that differ from the profile, one line each.

- An `available` ramp for the bear status Available (Mint `#A8E2C4` at step 90) — the positive ramp stays success-only.
- A `deployed` ramp for the bear status Deployed (Sky `#9CC9F5` at step 80) — the info ramp stays neutral facts.
- A `recharging` ramp for the bear status Recharging (Lilac `#C9B6F2` at step 80) — no status ramp carries it.
- A `backup` ramp for the bear status Needs backup (Blush `#F6B8C8` at step 80) — the negative ramp stays errors-only.
- `on-primary` is white (`neutral-100`) — white labels on Vivid Horizon (4.76:1); ink read too dark on periwinkle.
- `primary-strong` is `brand-primary-40` — a deeper hover keeps the white label readable.
- `secondary-normal` is `brand-secondary-80` — Lavender as a light pastel fill, so secondary lifts the UI instead of weighing it down.
- `on-secondary` is `brand-secondary-20` — dark lavender text on the pastel lavender fill.
- `secondary-soft` (dark) is `brand-secondary-20` — a deep lavender tint keeps lavender text readable in dark mode (5.09:1).
- Radius `soft` (1½× the TTT radii).
- Motion `playful` (more overshoot on `ease-expressive`) — the designer's pick, over the brand pack's "never bouncing".
- Density `comfortable` (32 / 36 / 40px controls, 12px padding).

**Provisional** — inputs still standing in for the client's own, one line each, with where they came from; `/ds-change` replaces them.

- `fonts` — extracted: Cumulus Brand Pack (Suggestions), Typography (Fredoka, Inter, JetBrains Mono)
- `logo` — kit default (none yet)
- `guidelines` — extracted: Cumulus Brand Pack (Suggestions)
- `radius` — extracted: Cumulus Brand Pack (Suggestions), Shape (12–20px radii)
- `status.positive` — kit default (TTT green)
- `status.cautionary` — extracted: Cumulus Brand Pack (Suggestions), Color table (Butter, warning / pending)
- `status.negative` — kit default (TTT red)
- `status.info` — kit default (TTT sky blue)
- `clientRamps` — extracted: Cumulus Brand Pack (Suggestions), Color table (bear status colours)
- `cover` — extracted: Cumulus Brand Pack (Suggestions), Name and positioning, Logo direction

**Open deviations** — none.
