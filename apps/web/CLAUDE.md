<!-- design-system-kit 0.28.21 · profile shadcn · wiring: CLAUDE.md design-system section -->

# Design system

**Cumulus is the source of truth; shadcn is the scaffolding.** The look
comes from the design system (https://claude.ai/artifact/E1gfFWs3TKCtUnxHQbcaTN): brand rules, the Tailwind
names to build with ("Using in code"), and every component's docs and preview.
If a component renders differently from its preview, fix the port — don't adjust
the CSS to taste. Deviations go to the tracker: https://app.clickup.com/8593845/v/l/li/901115605177.

## Usage rules

- **Use the stock component** from `@/components/ui`, with the props it has —
  the kit's included (Table `density`, Card `variant`, Badge `tone`…; each
  README lists them). A client extension needs a stated reason — a
  capability neither offers. Don't fork a component to style it.
- **Components are code-owned, tokens are design-owned.** Token changes come
  down from the design system (`/ds-apply`); component changes are made
  here and published back (`/ds-sync push`). A component the library
  ships that the system lacks, or a new look for one, is proposed in the
  design system first (`/ds-change`), then built (`/ds-apply`).
- **Screens and compositions are app code**, built from the components and
  tokens; they never go in the design system. They follow its **Patterns**
  section (forms and validation; empty, loading and error states; confirm or
  undo; alert, toast or dialog; navigation): depart from one only for a
  reason stated in the task or PR.
- **Errors pair an icon and a word with colour**, and are written as fixes
  ("Use at least 8 characters", not "Invalid"). Sentence case; no emoji.
- Wrap anything that scales or slides in `motion-safe:`.
- **A state shown only by a fill disappears in Windows high contrast mode**
  (the OS paints every background Canvas). The kit's components are covered
  (`forced-colors.css`); a custom one that marks selected, on or current by
  background alone adds a border or outline, or a `forced-colors:` rule with
  system colours (`forced-colors:bg-[Highlight]`).

None yet.

## Styling

- Use **only** the Tailwind names in the design system's "Using in code": every
  semantic token is a utility of the same name (`text-label-strong`,
  `bg-status-positive-soft`); text styles are `type-<style>`;
  `p-4` is `space-4`. No hex, no arbitrary colours (`bg-[#…]`), no default
  palette classes (`bg-zinc-…`: the token file turns the palette off, so they
  style nothing). Lint enforces it outside `@/components/ui`:
  `design-system/no-raw-colour` errors (a raw colour or a default palette
  class), `design-system/no-arbitrary-size` warns (`p-[18px]`). An exception is an `eslint-disable` comment with its
  reason; a value the tokens keep missing is a token request to design.
- **Naming clash:** shadcn's `secondary` and `accent` are neutral greys. The
  brand ones are `brand-secondary` and `brand-accent`.
- **Generated, never hand-edited:** `src/styles/ds-tokens.css` and `.ttt/` (the token
  snapshot, the System snapshot, the config). A token change is a design
  change: log a deviation rather than editing a value here.

## Locale defaults

Locale, week start and date format live in `@/lib/locale` — app code, not
part of the design system. `DatePicker` and `Calendar` default to them; pass
a prop to override one instance. Change the defaults there (import a date-fns
locale only in that file).

## Component rules

- **Field:** `Field` → `FieldLabel` → control → `FieldDescription` /
  `FieldError`; `data-invalid` on the Field, `aria-invalid` on the control.
  Wire `aria-describedby` to the error's id by hand, and focus the first invalid
  control on a failed submit — Field does neither.
- **Loading buttons:** spinner, `disabled` and `aria-busy` together —
  `<Button disabled={saving} aria-busy={saving}>{saving && <Spinner />}Save</Button>`.

None yet.

**Superseded by stock — don't reintroduce:** `input.tsx`'s `InputGroup` (use
`input-group.tsx`), `InputMessage` (`FieldDescription` / `FieldError`),
`TableEmpty` (`TableCell colSpan` → `Empty`), Tabs `pill`/`underline`
(`TabsList variant="default" | "line"`), Card `compact` (`size="sm"`).

The design system's inventory says which components exist: `validated` ones are
agreed but not in code yet — don't import them.

## Gotchas already paid for

- **Global CSS outside a layer beats every utility** (Tailwind v4). App-wide
  rules go in `@layer base`: a top-level `*:not(dialog) { margin: 0 }` beats
  `mx-2`, whatever the specificity. `pnpm ds:validate` names any it finds.
- **Type styles are utilities:** `type-<style> text-sm` takes
  text-sm's size and the rest from the style; `md:type-<style>`
  works.
- **`outline-none` kills focus rings** (Tailwind v4). Focus comes from one
  `:focus-visible` rule in the global CSS.
- **Base UI sets `aria-disabled`, not `disabled`,** on Tabs and Accordion
  triggers — style them with `aria-disabled:`.
- **Renamed event props type-check:** a Radix-style `onSelect` builds and never
  fires; Base UI's is `onClick`. Click it in the browser after primitive changes.
- **Sonner's stylesheet outranks utilities:** anything it sets needs `!` in
  `sonner.tsx`.
- **Vite:** restart the dev server after you change `vite.config.ts` (the
  Tailwind plugin). `build` and `build:safe` both run `vite build`.
- **`data-slot` stays on the element its classes are applied to** — the styling
  maps read the TSX.
- `@tanstack/react-table` stays on v8 (DataTable); v9 drops `useReactTable`.

## Tooling

The kit's tools run from the design-system-kit Claude Code plugin (`/ds-sync`),
not from this repo. The repo carries one: `scripts/ds-validate.mjs` with
`scripts/ds-drift.test.mjs`, its CI check. Fix kit files in the kit.

<!-- end design-system-kit -->
