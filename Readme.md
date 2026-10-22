# Overview

This repository is TTT Studios' starter template for new projects: a monorepo with an Express API and a React web app, plus the tooling, CI, AI agent guardrails and infrastructure a new project needs on day one. Start each new project from it, then replace the parts your project does differently (see [What the template owns vs. what your project owns](#what-the-template-owns-vs-what-your-project-owns)).

### Directory structure

```
Fullstack-starter-template/
├── apps/
│   ├── api/            # Express backend (Node.js, TypeScript)
│   └── web/            # React frontend (Vite, TypeScript, the design system kit)
├── packages/
│   ├── claude-hooks/   # Claude Code hooks (see "AI agent hooks")
│   ├── eslint-config/  # Shared ESLint configuration
│   ├── oxlint-config/  # Shared oxlint configuration and custom lint rules
│   ├── sbom-tools/     # Locked cdxgen install for SBOMs (see SBOM.md)
│   └── vitest-config/  # Shared Vitest configuration and coverage setup
├── e2e/                # Playwright end-to-end tests
├── infra/              # Terraform infrastructure as code (Azure)
├── scripts/            # Shell scripts behind the pnpm scripts (e2e, CI checks, release notes)
├── release-notes/      # AI-generated release notes for qa/staging (see its README)
├── .claude/            # Claude Code settings, hooks and skills shared by the team
└── .github/            # GitHub Actions workflows, composite actions, templates, and CODEOWNERS
```

## What the template owns vs. what your project owns

Not every project runs on the same cloud, Git host or auth provider. The template splits into two parts, so you know what to keep and what you're free to swap.

**Core (keep).** These work the same in every project. Keep them, and port fixes back (see [Porting changes back to the template](#porting-changes-back-to-the-template)):

- Monorepo layout: pnpm workspaces, Turborepo, `apps/` and `packages/`
- Tool versions pinned with mise (`mise.toml`, `mise.lock`) and the drift check (`scripts/tool-versions/`)
- Git hooks with Lefthook (`lefthook.yml`)
- Linting with oxlint and ESLint (`packages/oxlint-config`, `packages/eslint-config`)
- Formatting with Prettier
- Typecheck (`pnpm typecheck`)
- Unit tests with Vitest (`packages/vitest-config`) and end-to-end tests with Playwright (`e2e/`)
- Claude Code hooks and skills (`.claude/`, `packages/claude-hooks`)
- PR template (`.github/pull_request_template.md`)
- CodeRabbit config (`.coderabbit.yaml`)
- API and web `src` foundations (`apps/api/src`, `apps/web/src/lib`)
- Dockerfiles and compose files (`apps/*/Dockerfile`, `Dockerfile.test`, `docker-compose*.yml`)

**Replaceable (swap per project).** These depend on choices each project makes. Keep them if they fit, replace or remove them if they don't:

- Cloud and `infra/`: the template ships Azure Terraform. A project on another cloud writes its own. The optional monitoring module (`infra/template/monitoring.tf`, see [MONITORING.md](MONITORING.md)) goes with it.
- Deploy workflows: `deploy-api.yml` and `fe-web-deployment.yml` deploy to Azure.
- Design system: `apps/web` ships with the design system kit on its default look. Keep it and adopt it for the client, or remove it: see [Design system](#design-system).
- Auth: the template ships no auth provider. `apps/web/src/lib/axios.ts` has a pluggable token source for whatever the project picks.
- Git hosting and CI: the workflows and actions in `.github/` run on GitHub Actions. So do these, which also need replacing or removing on another Git host:
  - SBOM and Grype scanning: `packages/sbom-tools`, `.github/actions/sbom-*`, `.grype.yaml` (see [SBOM.md](SBOM.md))
  - Release notes: `release-notes/`, `scripts/release-notes/` (uses the GitHub API and an `ANTHROPIC_API_KEY` secret)
  - React Doctor: `.github/workflows/react-doctor-web.yml`
  - The hook-parity check, which compares `lefthook.yml` with the GitHub workflows. Its pieces: the `hook parity` job in `lefthook.yml`, the `check:hook-parity` and `test:hook-parity` scripts in `package.json`, `scripts/hook-parity/`, and two steps in `lint.yml`. Remove all of them together: the `lefthook.yml` job runs on any `package.json` or workflow change, so a half-removed check fails every commit.
  - The [local CI push gate](#local-ci-with-act), which runs the GitHub workflows locally with act. Its pieces: `push-gate.ts`, `stamp-guard.ts` and `src/bin/pre-bash.ts` (all in `packages/claude-hooks/src`), `scripts/ci-local/`, the `pre-push` job in `lefthook.yml`, the `ci:local` and `test:ci-local` scripts, the `run-ci-locally` skill, `.actrc`, and the act pin in `mise.toml`.

## Porting changes back to the template

Projects started from the template often fix or improve something generic: a lint rule, a CI step, a Docker fix, a better hook. That work should come back to the template so the next project starts with it.

1. **Keep generic work in its own PR.** Don't mix it with project features. A PR that only touches tooling, CI or shared config can be cherry-picked cleanly; one that also renames a domain model can't.
2. **Label it `template-candidate`.** Keep project-specific names, secrets and client details out of it. A repo created from the template gets its files but not its labels, so create the label once per project repo:

   ```sh
   $ gh label create template-candidate --description "Generic change to port back to the template" --color 0e8a16
   ```

3. **The template owner reviews these PRs every two weeks** and cherry-picks the ones that fit into the template. To list them across the org:

   ```sh
   $ gh search prs --owner tttstudios --label template-candidate --merged
   ```

   Then, for each PR worth porting:

   ```sh
   # In a clone of the template repo
   $ git remote add <project> <project repo URL>
   $ git fetch <project>
   $ git checkout -b chore/port-<change>
   $ git cherry-pick <commit sha>        # a squash-merged PR
   $ git cherry-pick -m 1 <merge sha>    # a PR merged with a merge commit
   ```

   Then open a PR into the template's `main` as usual.

## Design system

`apps/web` ships with TTT's [design system kit](https://github.com/tttstudios/design-system-kit) already applied, on the kit's default look: shadcn/ui components (Base UI, the `base-nova` style) with the kit's changes, design tokens, light and dark themes, and lint that keeps app code on the tokens. A new project can build screens on day one. The client's brand comes later through the token values alone, so screens built on the tokens take it on without changes.

The template's design-system config, `apps/web/.ttt/design-system.json`, says `"setup": "template"`: the kit is in place, but no project has adopted it yet. There's no design system on claude.ai, ClickUp tracker or Figma library yet, and `kitVersion` says which kit release the template carries.

### Prototype right away on the default look

No setup or plugin is needed to build screens:

- **Components:** import them from `@/components/ui/<name>` (Button, Field, Input, Select, Dialog, Table, DataTable, DatePicker, Sidebar and the rest in `apps/web/src/components/ui/`). Use the props they have, the kit's included (Table `density`, Card `variant`, Badge `tone`); don't fork a component to style it.
- **Styling:** use the tokens' Tailwind names: `bg-background`, `text-label-strong`, `border-line-normal`, `bg-status-positive-soft`, `rounded-lg`, and the text styles `type-<style>` (`type-body-1`). Spacing is the token scale, so `p-4` is `space-4`. Every name is in the generated `apps/web/src/styles/ds-tokens.css`.
- **Tokens-only lint:** `pnpm lint` fails on a raw colour (`bg-[#1a2b3c]`, a `"#fff"` string) or a Tailwind default palette class (`bg-zinc-500`), and warns on an arbitrary size (`p-[18px]`), in app code: everything but the kit's vendored files (`src/components/ui/`, `theme-provider.tsx`, `use-mobile.ts`), tests and `scripts/`. An exception is an `eslint-disable` comment that says why. The token file turns the default palette off (only `black` and `white` stay), so a palette class would style nothing anyway.
- **Themes:** `ThemeProvider` (next-themes) in `main.tsx` sets `data-theme` on `<html>`, following the system setting by default. `dark:` utilities key off it.
- **Don't edit** `apps/web/.ttt/` or `src/styles/ds-tokens.css`: they're generated from the design system's tokens. `apps/web/CLAUDE.md` gives Claude Code the same rules.

The default look is a placeholder. `/ds-sync` and `/ds-change` stop on the template state until the project adopts it.

### Starting a client project

When the project has a client and a designer, take the kit from the template state to the client's own design system in three steps, each in `apps/web`. Everyone who runs one needs Claude Code with the **design-system-kit plugin at the template's `kitVersion` (0.28.21 today) or later**: an older plugin stops. To update it, run `claude plugin update design-system-kit@ttt-design` and restart Claude Code.

| Step      | Who          | Run                                                                 | What it does                                                                                                                                                                                                                                   |
| --------- | ------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Adopt  | a dev        | `/ds-setup start`                                                   | Asks for the design system's name (and confirms its namespace), the project's ClickUp list, and the designer and a due date. Opens one small PR on a `ds-adopt/<date>` branch: merge it straight away. Creates the designer's task in ClickUp. |
| 2. Design | the designer | `/ds-setup design`, on an up-to-date `main` with `pnpm install` run | Brand inputs, tokens, the design system on claude.ai (the designer creates it and shares it with the dev), the review, and the Figma library. Needs the Figma connector and an editor seat. It never writes to the repo.                       |
| 3. Finish | a dev        | `/ds-setup finish`, on an up-to-date `main`                         | Asks for the design system's link, brings the approved design system into the code on a `ds-setup/<date>` branch it cuts itself, and opens the PR.                                                                                             |

Screens built on the default look in the meantime are fine: they take on the brand when step 3 merges. After that, use `/ds-change` for design changes, `/ds-apply` to bring them into code and `/ds-sync push` to publish code changes back. If your plugin is newer than the template's `kitVersion`, step 1 stops and asks for `/ds-upgrade` first: run it, merge its PR, then adopt.

Every push from a project runs [local CI](#local-ci-with-act) first, so have Docker running before steps 1 and 3.

### Opting out of the kit

The kit is replaceable, like the template's other choices. A project that doesn't want it removes all of the following in one PR. In `apps/web`:

- `.ttt/`, `scripts/ds-validate.mjs` and `scripts/ds-drift.test.mjs`
- `src/components/ui/`, `src/components/theme-provider.tsx`, `src/hooks/use-mobile.ts` and `src/lib/locale.ts`
- `src/styles/ds-tokens.css` and `src/styles/fonts.css`
- `CLAUDE.md` (it holds only the kit's section) and `doctor.config.json` (only the kit's React Doctor overrides)
- In `src/config/global.css`: the `ds-tokens.css` and `fonts.css` imports at the top, with their comments; the focus rule at the end of the reset's `@layer base`; the `design-system-kit … theme block` section after it (the `@source` line, the `dark` custom variant and its own `@layer base` with the `* { @apply border-border }` and `body { @apply … }` rules); and the forced-colors layer at the end. Keep the reset in `@layer base`.
- In `src/main.tsx`: the `ThemeProvider` import and wrapper
- In `eslint.config.ts`: everything from the `design-system-kit` stamp line to `---- end design-system-kit` (its two `eslint` imports included), and the `withDesignSystem(...)` wrapper around the entries
- In `.oxlintrc.json`: the override under the `design-system-kit` comment
- In `vitest.config.ts`: the `scripts/**` coverage exclude
- In `package.json`: the `ds:validate` and `build:safe` scripts; `@tanstack/react-table`, `date-fns`, `next-themes`, `react-day-picker` and `sonner`; and the dev dependencies `@tailwindcss/cli`, `esbuild` and `postcss`

At the root, remove the `design-system-kit` block from `.prettierignore`.

That leaves Tailwind v4 and shadcn/ui set up, without the kit. To drop those as well, also remove `components.json` and `src/lib/utils.ts`; `@base-ui/react`, `class-variance-authority`, `cn`, `lucide-react`, `shadcn`, `tw-animate-css`, `tailwindcss` and `@tailwindcss/vite`; the `tailwindcss()` plugin in `vite.config.ts`; and the `tailwindcss`, `tw-animate-css` and `shadcn/tailwind.css` imports in `global.css`. The reset can then come back out of `@layer base`. Finish with `pnpm install` and `pnpm verify`.

### Maintenance

- **The kit side owns keeping this template current.** After each kit release, the kit's maintainers run `/ds-upgrade` in this repo and open its PR, reviewed like any other. Don't edit the kit's files by hand: the stamped components in `src/components/ui/`, `scripts/ds-validate.mjs`, the drift test, and the stamped sections of `CLAUDE.md`, `global.css`, `eslint.config.ts` and `.oxlintrc.json`. A fix to one goes to the kit repo, so every project gets it.
- **The kit is tested on specific package versions**, its tested range (React, Tailwind, Base UI, shadcn, Vite, ESLint and the others in the kit's `tested-range.json`). The packages Setup added are pinned to them. **A new major of any of them waits for a kit acceptance run**, which widens the range, and then comes in through `/ds-upgrade`. Don't bump them by hand.
- **A project spun up from the template** keeps its own copy. It upgrades with `/ds-upgrade` in its own repo.

## Getting Started

### Prerequisites

Every tool version (Node, pnpm, Terraform) is pinned in one file, [`mise.toml`](mise.toml). [mise](https://mise.jdx.dev) reads it and installs those exact versions, so your laptop, other laptops, and CI all run the same tools. CI uses the same file through `jdx/mise-action`.

#### 1. Install mise

```sh
# Linux / macOS
curl https://mise.run | sh
# or: brew install mise

# Windows
winget install jdx.mise
```

Then hook mise into your shell so the pinned versions are on your `PATH` whenever you are inside this repo (see [activation docs](https://mise.jdx.dev/getting-started.html#activate-mise)):

```sh
# bash
echo 'eval "$(mise activate bash)"' >> ~/.bashrc
# zsh
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
```

```powershell
# PowerShell (add to $PROFILE)
mise activate pwsh | Out-String | Invoke-Expression
```

On Windows, run the repo's shell scripts (`pnpm check:tool-versions`, `pnpm test:e2e`, git hooks) from Git Bash or WSL, since they are bash scripts.

If mise isn't active in a shell (an IDE terminal, a GUI git client), `pnpm install` still fails with a clear "Unsupported engine" error on the wrong Node or pnpm, because `package.json` sets `engines` and `pnpm-workspace.yaml` sets `engineStrict: true`. The pre-commit hook runs Terraform through `mise x --`, so it works even without activation.

#### 2. Install the pinned tools

```sh
# Trust this repo's mise.toml (first time only), then install everything in it.
# Downloads are checked against the checksums in mise.lock.
$ mise trust
$ mise install

# Verify
$ node -v       # matches mise.toml
$ pnpm -v       # matches mise.toml
$ terraform -v  # matches mise.toml
```

#### 3. Install dependencies

```sh
# Install turbo for better developer experience (optional)
$ pnpm add turbo --global

# Install all dependencies (also installs the git hooks)
$ pnpm i

# Build shared packages
$ pnpm build
```

#### 4. Set up local CI (everyone)

Every push, yours or an AI agent's, only goes through once every PR check has passed on your machine (see [Local CI with act](#local-ci-with-act)). The checks run in Docker with [act](https://github.com/nektos/act), which `mise install` already installed.

- **Linux:** install Docker Engine and make sure your user can run `docker` without `sudo`.
- **macOS (Intel or Apple Silicon):** install [Docker Desktop](https://www.docker.com/products/docker-desktop/) or [OrbStack](https://orbstack.dev). On Apple Silicon, turn on Rosetta for x86/amd64 emulation (Docker Desktop: Settings > General; OrbStack has it on by default). The checks run as `linux/amd64`, like GitHub's runners.
- **Windows:** use WSL2 with Docker Desktop's WSL backend, and clone and run the repo inside WSL. This isn't tested by the team.

```sh
# Verify
$ act --version   # matches mise.toml
$ docker info     # must not error: Docker has to be running

# Optional: run every PR check once now, so the runner image (about 1.5GB) is
# downloaded before your first push
$ pnpm ci:local
```

#### Bumping a tool version

1. Change the version in `mise.toml`.
2. Refresh the checksums in `mise.lock`, then install:

   ```sh
   $ mise lock --platform linux-x64,linux-arm64,macos-arm64,macos-x64,windows-x64
   $ mise install
   ```

3. A few files can't read `mise.toml` and keep a copy of the version. Update them too:
   - root `package.json`: `packageManager` (pnpm) and `engines` (`node` as `^<node version>`, `pnpm` exact)
   - `ARG NODE_VERSION` / `ARG PNPM_VERSION` in `apps/api/Dockerfile`, `apps/web/Dockerfile` and `Dockerfile.test`
4. Run the drift check:

   ```sh
   # Fails if any copy drifted from mise.toml, a pnpm version is hardcoded
   # anywhere else, or a workflow sets up Node/pnpm on its own
   $ pnpm check:tool-versions
   ```

CI runs the same check, and its tests (`pnpm test:tool-versions`), in the Typecheck workflow. Workflows install their tools with `jdx/mise-action`. Four go through the shared `.github/actions/setup` action, which also pins the mise version itself: `typecheck.yml`, `code-coverage.yml`, `deploy-api.yml` and `fe-web-deployment.yml`. `lint.yml` and `terraform.yml` call `jdx/mise-action` directly and don't pin mise itself. The rest install no mise tools.

### Environment variables

Every variable the apps read is listed in [`.env.example`](.env.example) at the repo root, with a comment and a safe example value. Nothing is required: each variable has a default, so `pnpm compose:dev:up`, `pnpm dev:no-docker` and the tests all run without a `.env` file.

To change a value locally, copy the example and edit your copy. Git ignores `.env`, so it's never committed:

```sh
$ cp .env.example .env
```

| File           | Committed | Who reads it                                                                                                                                                              |
| -------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.example` | Yes       | People. It documents every variable. No app loads it                                                                                                                      |
| `.env`         | No        | The web app (Vite reads it from the root), the api in `pnpm dev:no-docker` (`--env-file-if-exists`), and both services in `docker-compose-dev.yml` (`env_file`, optional) |
| `.env.test`    | Yes       | Vite and Vitest in test mode, so unit tests and CI get the same safe fixture values                                                                                       |

Keep it one shared set of files at the root, not one per app, so there's one place to look. When you add a variable:

1. Read it in the app (on the api, through `requiredEnv` or `getServerConfigFromEnvVars` in `apps/api/src/config`).
2. Add it to `.env.example` with a one-line comment and a safe example value.
3. Add a safe fixture value to `.env.test` if tests need it.
4. If it changes a cached turbo task's output, add it to that task's `env` list in `turbo.json`.

Never put a real secret in `.env.example` or `.env.test`. Deployed environments get their values from the deploy workflows and Key Vault, not from these files.

Playwright (`playwright.config.ts`) doesn't read `.env`. `BASE_URL` and `API_URL` come from your shell, and `docker-compose-e2e.yml` sets them for the e2e stack.

### Docker & Containerization

We recommend getting familiar with Docker and Linux containers. If you are new to these technologies, check out this [free ebook](https://github.com/bobbyiliev/introduction-to-docker-ebook).

#### Local development with Docker

Both the `api` and `web` applications are dockerized. To start local development using Docker, run:

```sh
# Start API and Web containers in development mode
$ pnpm compose:dev:up
# Tears down all dev containers and their volumes
$ pnpm compose:dev:down
```

Access the web app at [http://localhost:5173](http://localhost:5173) and the API at [http://localhost:8000](http://localhost:8000).

To have containers auto-rebuild when `pnpm-lock.yaml` or a service's `package.json` changes, run Compose watch mode alongside `compose:dev:up` (in a separate terminal):

```sh
$ pnpm compose:dev:watch
```

#### Running with Docker

To start the containers using a production-ready build, you can use:

```sh
# Start API and Web containers
$ pnpm compose:up
# Tear down containers
$ pnpm compose:down
```

Access the web app at [http://localhost](http://localhost) or [https://localhost](https://localhost), and the API at [http://localhost:8080](http://localhost:8080).

### Local development without Docker

We do not recommend this approach, but we also understand that Docker has a learning curve. If you are unfamiliar with Docker and just want to develop locally:

```sh
# Run api and web applications locally
$ pnpm dev:no-docker
```

If you are familiar with Docker and still prefer this approach, please consider opening an issue on the [repository](https://github.com/tttstudios/Fullstack-starter-template) explaining what difficulties you are experiencing.

### Executing tests

In the workspace directory, you can execute the following commands:

```sh
# Test all applications and packages using turbo (faster due to turbo cache)
$ pnpm test
# Execute all tests
$ pnpm test:projects
# Execute all tests with watch mode
$ pnpm test:projects:watch
# Creates a test coverage report
$ pnpm test:report
# Creates a test coverage report and opens it on your browser
$ pnpm test:report:view
# Runs the unit tests in a Docker container (coverage lands in packages/vitest-config/coverage)
$ pnpm compose:test:up
$ pnpm compose:test:down
```

End-to-end tests use [Playwright](https://playwright.dev) and live in `e2e/`:

```sh
# Runs the e2e suite headlessly in Docker, the same way CI does (needs Docker running)
$ pnpm test:e2e
# Opens Playwright's UI mode. Start the apps first (e.g. `pnpm dev:no-docker`); the first time, run `pnpm exec playwright install chromium`
$ pnpm test:e2e:ui
```

The [`write-e2e-test`](.claude/skills/write-e2e-test/SKILL.md) and [`fix-e2e-test`](.claude/skills/fix-e2e-test/SKILL.md) skills walk Claude Code through writing and fixing these tests.

### Typechecking

```sh
# Typechecks all apps/packages, plus the root-level eslint.config.ts/vitest.config.ts
$ pnpm typecheck
```

This runs `tsc --noEmit` (or `tsc -b --noEmit` where an app uses TypeScript project references) across every app and package. It's a required, blocking check in CI (`typecheck.yml`) so a broken type can't merge unnoticed.

### Linting

Linting runs in two steps: [oxlint](https://oxc.rs/docs/guide/usage/linter) first, then ESLint.

- **oxlint** is a linter written in Rust, 50 to 100 times faster than ESLint. It runs most of our rules (core JS, TypeScript, import, promise, React, React hooks, JSX a11y) plus our own custom rules. Its config lives in `packages/oxlint-config` (`base.json`, `react.json`), and each app extends it from its own `.oxlintrc.json`.
- **ESLint** only runs the rules oxlint doesn't have yet: `eslint-plugin-security`, `turbo/no-undeclared-env-vars`, `prefer-arrow-functions`, `import-x/order`, `import-x/no-unresolved` and a few React Compiler rules. Its config lives in `packages/eslint-config`. [eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint) turns off every ESLint rule that oxlint already runs, so no rule runs twice.

To turn off a rule on one line, use the comment for the tool that runs it:

- Rules oxlint runs: `// oxlint-disable-next-line <rule> -- <reason>`
- ESLint-only rules (listed above): `// eslint-disable-next-line <rule> -- <reason>`

Don't use `eslint-disable` for a rule oxlint runs. oxlint obeys it, but ESLint reports it as an unused directive and fails, and `pnpm lint:fix` deletes it.

Install the [oxc](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode) and [eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) VS Code extensions to see both in your editor.
**Note**: If you want to add the linter rules under your app, you must install `jiti` as a dev dependency. See more info on [how to use typescript configuration files here](https://eslint.org/docs/latest/use/configure/configuration-files#typescript-configuration-files)

```sh
# Runs oxlint, then ESLint, in all apps/packages
$ pnpm lint
# Same, and fixes all automatically fixable issues
$ pnpm lint:fix
# Lints root-level files (e2e/, root configs)
$ pnpm lint:root
```

To move a rule from ESLint to oxlint, add it to `packages/oxlint-config/base.json` (or `react.json`). ESLint stops running it on its own. Check the [oxlint rule list](https://oxc.rs/docs/guide/usage/linter/rules) first.

#### Writing a custom lint rule

Team conventions can be lint errors instead of notes in a doc. Custom rules live in the `repo` plugin in `packages/oxlint-config/src/plugins/`. Example: `repo/no-direct-axios` makes the web app use the shared client in `src/lib/axios` instead of importing `axios` directly.

1. Add a rule file in `packages/oxlint-config/src/plugins/rules/`. Rules use the same API as ESLint rules (`meta` + `create`), wrapped in `defineRule` from `@oxlint/plugins`. Use `no-direct-axios.ts` as a template.
2. Add a test next to it in `rules/__tests__/`, using `RuleTester` from `oxlint/plugins-dev`. List code that should pass (`valid`) and code that should fail (`invalid`).
3. Register the rule in `src/plugins/repo-conventions.ts`.
4. Turn it on in the `.oxlintrc.json` of the app that should follow it, as `"repo/<rule-name>": "error"`. Use `overrides` to turn it off for files that are allowed to break it.
5. Run `pnpm --filter @repo/oxlint-config test` and `pnpm lint`.

Things to know:

- oxlint loads the plugin as TypeScript without a build step (Node's built-in type stripping). Keep the code plain TypeScript (no `enum` or `namespace`) and keep the `.ts` extension on relative imports.
- oxlint JS plugins are still in alpha and can't use type information. [Docs](https://oxc.rs/docs/guide/usage/linter/writing-js-plugins).

### Formatting

We use prettier to format the code. Make sure you have the [prettier vscode extension](https://github.com/prettier/prettier-vscode) installed. Try the following commands:

```sh
# Runs formatter
$ pnpm format
# Runs formatter but only checks that files are already formatted (useful for CI)
$ pnpm format:check
```

### Git hooks

Git hooks are managed by [Lefthook](https://lefthook.dev) and configured in [`lefthook.yml`](lefthook.yml). `pnpm i` installs them.

The rule: **if CI would fail, the commit fails first.** Each hook calls the same pnpm script or turbo task CI calls, so a check is defined once. `pnpm check:hook-parity` (run by the hook and by the Lint workflow) fails if the hooks and the PR workflows stop running the same checks.

| Hook       | What runs                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| pre-commit | In parallel: Prettier on staged files (fixes are re-staged), `pnpm verify --affected` (lint, typecheck and unit tests), `pnpm lint:root` when root-level files (`e2e/`, root configs, the shared ESLint config) are staged, `pnpm terraform:fmt`/`terraform:validate` when `infra/**/*.tf` changes, `pnpm check:tool-versions`/`test:tool-versions` when a file with a pinned version changes, and `pnpm check:hook-parity` when `lefthook.yml`, `package.json` or a workflow changes |
| pre-push   | The local CI gate, `scripts/ci-local/pre-push.sh`: lets the push through if `pnpm ci:local` already passed for `HEAD`, otherwise runs it first (every PR workflow under act, then `scripts/e2e-ci.sh`). See [Local CI with act](#local-ci-with-act)                                                                                                                                                                                                                                   |

`--affected` limits turbo to the packages you changed (staged or not) plus the packages that depend on them. Turbo's cache skips anything already checked, so a small change with a warm cache takes a few seconds. `pnpm verify` without `--affected` runs every check on every package.

Things to know:

- Hooks run every command through `mise x --`, so they use the versions in `mise.toml` even from GUI git clients that don't load your shell profile. `mise` itself still has to be on the `PATH` git sees (see [Prerequisites](#prerequisites)).
- Checks run on your working tree, not only the staged content. Unstaged edits in the same package are checked too.
- The pre-push gate needs Docker running. A full run takes several minutes, so run `pnpm ci:local` yourself while you do something else; the push is then instant.
- Hooks don't install in CI (`CI` is set) or when `LEFTHOOK=0`.

On rare occasions, it may be necessary to bypass the pre-commit hook:

```sh
git commit --no-verify
```

**Warning**: Only bypass the pre-commit hook for tests you don't own, e.g. an unrelated app's suite is already broken on `main` and you don't know how to fix it. Never use `--no-verify` to skip a test that's failing because of your own change; fix it or ask for help instead.

Don't use `git push --no-verify`. The pre-push gate has exactly one way to skip it, for production hotfixes only: see [Skipping the local CI gate](#skipping-the-local-ci-gate). AI agents in Claude Code are blocked from the common ways to bypass the hooks (see [AI agent hooks](#ai-agent-hooks)).

### AI agent hooks

When a check fails, AI agents sometimes take a shortcut: `git commit --no-verify`, an `it.skip`, an `eslint-disable`. Asking them not to in the docs isn't enough, so this repo ships [Claude Code hooks](https://code.claude.com/docs/en/hooks) that block those shortcuts. They are committed in [`.claude/settings.json`](.claude/settings.json), so they are active for everyone who runs Claude Code in this repo. The code is small and lives in [`packages/claude-hooks`](packages/claude-hooks), with tests.

| When                                  | What the hook does                                                                                                                                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before Claude runs a shell command    | **Blocks** anything that skips the git hooks: `--no-verify`, `git commit -n`, `LEFTHOOK=0` / `LEFTHOOK=false`, `LEFTHOOK_EXCLUDE=...`, `HUSKY=0`, `SKIP_CI_LOCAL=...`, changing `core.hooksPath`, `lefthook uninstall`. Also inside `&&` chains and `bash -c "..."` |
| After Claude edits or writes a file   | Runs Prettier (writes the fix), then oxlint and ESLint on that file, with the repo's own config. Errors go straight back to Claude so it fixes them before moving on                                                                                                |
| Before Claude pushes or opens a PR    | **Blocks** `git push` and `gh pr create` (or a `gh api` call that creates a PR) until `pnpm ci:local` has passed for the current commit on a clean tree. See [Local CI with act](#local-ci-with-act)                                                                |
| Before Claude writes the pass stamp   | **Blocks** any Edit/Write or shell command that names `.git/ci-local-pass` and could write it                                                                                                                                                                       |
| After an edit adds a check suppressor | **Warns** Claude to justify or remove it: `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error`, `.skip(`, `.only(`, `.fixme(`, `xit(`, `fit(`, `xdescribe(`, `fdescribe(`. A warning, not a block, since some are legitimate                           |

When a command is blocked, Claude sees: "Bypassing checks is not allowed. Fix the failing check and commit again."

Things to know:

- The hooks are TypeScript run straight from source, so they need the Node version from `mise.toml`. `.claude/hooks/run-hook.sh` runs them through `mise exec` when mise is installed, and falls back to `node` from your `PATH` when it isn't.
- If the shell command hook can't start (for example `mise.toml` not trusted, or no mise and the `node` on your `PATH` is too old) or takes too long, the command is **blocked** with setup steps, instead of silently letting it through. `run-hook.sh` stops the hook itself a few seconds before Claude Code's own `timeout`, because a hook that Claude Code times out lets the command through.
- Only the shell command hook can block. The edit hooks run after the file is already written, so if they can't run, Claude gets the setup steps but the edit stays, unformatted and unlinted.
- Linting a file after an edit takes several seconds, mostly ESLint starting up. oxlint adds about half a second.
- Only Claude Code's tool calls are checked. Commands you type in your own terminal aren't affected; Lefthook still covers those.
- The command check is a best-effort parser, not a full shell. It catches the common forms, not every possible trick. The CI workflows are still the final gate.

### Local CI with act

`pnpm ci:local` runs every PR check on your machine, the way GitHub Actions runs them:

1. Every workflow in `.github/workflows/` with a `pull_request` trigger runs under [act](https://github.com/nektos/act), which runs the workflow files unchanged in Docker containers. Think "GitHub Actions on your laptop".
2. Then `scripts/e2e-ci.sh` runs directly on your machine. That's the script `e2e.yml` calls; it starts its own Docker Compose stack, so it doesn't need an act container around it.

Lefthook's pre-commit hook runs the same pnpm scripts as CI, so it catches code problems. It doesn't catch workflow problems: broken YAML, a bad setup step, a tool missing in a clean runner. `pnpm ci:local` runs the real workflow files, so it catches most workflow problems before GitHub does. It isn't an exact copy of GitHub's run: it checks your commit, not the PR merged with `main` (it warns you when `origin/main` has commits your branch doesn't, so rebase first); E2E runs `scripts/e2e-ci.sh` on your machine; React Doctor's scan and the SBOM artifact handoff don't run (see [How it's set up](#how-its-set-up)); and the runner image is act's, not GitHub's. A red GitHub run after a green local one is a real result, not a flake.

```sh
# Every check, fastest first, stopping at the first failure. Takes several minutes.
$ pnpm ci:local

# Every check, even after a failure, so you see all of them at once
$ pnpm ci:local --keep-going

# Just one workflow (writes no pass stamp)
$ pnpm ci:local .github/workflows/typecheck.yml
```

The checks run one at a time, in this order: typecheck, lint, terraform, code coverage, React Doctor, SBOM, then E2E. A new PR workflow is picked up with no extra setup, after those, as long as act can run it. If act skips a job because it has no image for its `runs-on` (macOS, Windows, self-hosted), the check fails instead of counting as a pass. Deploy and release workflows (push to an env branch) aren't run: they need Azure and repo secrets.

When every check passes on a clean working tree (nothing to commit), it writes a **pass stamp**: the current commit SHA, in `.git/ci-local-pass`. The stamp lives under `.git/`, so it's never committed. A run on one workflow, a failing run, or a run with uncommitted changes writes no stamp.

#### The push gate

Every push is gated on that stamp, so broken code never reaches GitHub in the first place:

- **Your pushes:** Lefthook's pre-push hook ([`scripts/ci-local/pre-push.sh`](scripts/ci-local/pre-push.sh)) lets the push through right away if the stamp matches `HEAD`. If it doesn't, the hook runs `pnpm ci:local` first and pushes only if everything passes. Commit first: a dirty working tree is refused, since the checks wouldn't match what you push. Push from the branch you have checked out: the stamp only covers `HEAD`, so pushing another branch (`git push origin other-branch`) is refused. Tags aren't gated, since they don't open or update a PR. Run `pnpm ci:local` yourself while you do something else, and the push is instant.
- **AI agents' pushes:** the Claude Code hooks (see [AI agent hooks](#ai-agent-hooks)) block `git push` and `gh pr create` (and `gh api` calls that create a PR) unless the working tree is clean, the stamp matches `HEAD`, and the push only sends `HEAD` or the current branch. `git push --all`, `--mirror`, `--tags`, or a refspec like `other-branch:main` or `HEAD~5:x` is blocked, since the stamp only covers `HEAD`. Agents can't skip the gate: `--no-verify`, `LEFTHOOK=0` and `SKIP_CI_LOCAL` are all blocked for them.

An agent that pushes, waits for CI, sees a failure, fixes and pushes again burns time and tokens, and so does a person. When a push is blocked, Claude sees what to do: run `pnpm ci:local`, fix the failures, commit, then push. The [`run-ci-locally`](.claude/skills/run-ci-locally/SKILL.md) skill tells it how to read the failures.

The hooks also block Claude from writing the stamp itself with Edit/Write, or with a shell command that names it, like `echo ... > .git/ci-local-pass`. A new commit makes the old stamp stale, so `pnpm ci:local` has to run again.

**These hooks stop accidental skips, not a determined agent.** They match command shapes, so an agent that builds the stamp path in pieces or writes it from a script can get around them. Don't treat them as a security boundary. The real CI checks on GitHub are what catch bad code.

#### Skipping the local CI gate

Everyone follows the standard process: commit, `pnpm ci:local`, push. There is exactly **one** case where a person may skip the gate:

- **A production hotfix under time pressure.** Production is broken and minutes matter.

```sh
SKIP_CI_LOCAL=1 git push
```

The hook prints a warning and lets the push through. GitHub CI still runs on the PR and **must pass before the PR merges**. Mention the skip in the PR description.

These are **not** reasons to skip:

- "It's slow", "it's a small change", or "CI will catch it".
- Docs-only changes. Prettier checks Markdown, so a docs change can still fail CI.
- Your local setup is broken (Docker won't start, act fails before any check runs). Fix the setup; see [Troubleshooting](#troubleshooting). Ask the team if you're stuck.
- Backing up work in progress. Run the checks, or keep the work local.

Don't use `git push --no-verify` or `LEFTHOOK=0` instead: they skip the gate with no warning.

#### Troubleshooting

- **`act isn't installed`:** run `mise install`.
- **`Docker isn't running`:** start Docker Desktop, OrbStack or the Docker service, then check `docker info` works.
- **Slow first run:** the first run downloads the runner image (`catthehacker/ubuntu:act-24.04`, about 1.5GB) and fills act's cache. Later runs reuse both.
- **Apple Silicon errors like `exec format error`:** turn on Rosetta (x86/amd64 emulation) in Docker Desktop's settings. The checks run as `linux/amd64` to match GitHub's runners.
- **A step fails only under act:** compare with the same workflow's last run on GitHub. If GitHub passes and act fails, it's a difference between act and GitHub's runner, not your code. Ask the team before changing the workflow.
- **Disk filling up:** act's images and caches live in Docker. `docker system df` shows the space, and `docker image prune` frees unused images.

#### How it's set up

- **act's settings are committed** in [`.actrc`](.actrc): the runner image for `ubuntu-latest` (`catthehacker/ubuntu:act-24.04`, a smaller image than GitHub's; each workflow installs its own tools with mise, so the missing extras don't matter) and `--container-architecture linux/amd64`.
- **PR-only steps skip locally.** A local run has no real PR, so steps that comment on a PR (the coverage comment) skip with `if: ${{ !env.ACT }}`. act sets `ACT`; GitHub never does, so on GitHub they post as before. `pnpm ci:local` passes each run a `pull_request` event payload with PR number 0 and the merge base with `origin/main` as the base SHA, so steps that diff against the base have one.
- **Artifacts work locally, mostly.** `pnpm ci:local` starts act's artifact server in a temp folder (on a free port, so two runs at once don't clash), so `upload-artifact@v4` steps work. The folder is deleted after the run. act can't take `upload-artifact@v7` uploads yet, so under act the SBOM workflow skips its upload and runs the Grype scan in the same job, instead of handing the SBOM to the separate scan job.
- **React Doctor's scan skips locally.** The action can't start under act (act's `/var/run` link trips the action's own startup check). It's set to `blocking: none`, so on GitHub it only comments and never fails a PR; nothing is lost.
- **Checkouts use your working tree.** act copies your local files only when `actions/checkout` has no `ref:` key at all (even one that evaluates to empty counts); with one, it fetches from GitHub instead. A PR workflow that needs a `ref:` needs a second, ref-less checkout step for act, like `sbom-source.yml` has (`if: ${{ env.ACT }}` / `if: ${{ !env.ACT }}`).
- **Worktrees work.** In a git worktree, `.git` points into the main checkout's `.git` folder, which act doesn't copy, so `pnpm ci:local` mounts that folder read-only into the containers.
- **No secrets, `vars` or OIDC.** `pnpm ci:local` passes no secrets or `vars` (so `vars.X` conditions take their defaults), and there is no OIDC token for `id-token: write`. Today's PR workflows need none of these. If a new PR workflow needs a secret, make that step skip on local runs with `if: ${{ !env.ACT }}` instead of handing secrets to every developer's machine.
- **act comes from its GitHub release.** `mise.toml` pins `aqua:nektos/act`, and `mise.lock` records the sha256 of each platform's download, so `mise install` refuses a file that doesn't match. After changing any version in `mise.toml`, run `mise lock` and commit `mise.lock`.
- **CI doesn't install act.** Each workflow's `jdx/mise-action` step sets `MISE_DISABLE_TOOLS` so CI runners don't download it.
- **The scripts work on macOS's bash 3.2.** The Lint workflow runs their tests in a bash 3.2 container.

### Creating a new package

```sh
# Create an empty dir
$ mkdir -p packages/<your-package>
# Cd into dir
$ cd packages/<your-package>
# Initialize package
$ pnpm init --init-type module
```

### Managing infrastructure

See [`infra/Readme.md`](infra/Readme.md).

## CI/CD

These GitHub Actions workflows run on pull requests:

| Workflow             | File                                                                               | Triggers                                                                                               |
| -------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Typecheck            | [`.github/workflows/typecheck.yml`](.github/workflows/typecheck.yml)               | PR opened, synchronised, or reopened                                                                   |
| E2E                  | [`.github/workflows/e2e.yml`](.github/workflows/e2e.yml)                           | PR opened, synchronised, or reopened                                                                   |
| Lint                 | [`.github/workflows/lint.yml`](.github/workflows/lint.yml)                         | PR opened, synchronised, or reopened                                                                   |
| Terraform            | [`.github/workflows/terraform.yml`](.github/workflows/terraform.yml)               | PR opened, synchronised, or reopened                                                                   |
| Code Coverage Report | [`.github/workflows/code-coverage.yml`](.github/workflows/code-coverage.yml)       | PR opened, synchronised, or reopened                                                                   |
| React Doctor (web)   | [`.github/workflows/react-doctor-web.yml`](.github/workflows/react-doctor-web.yml) | PR touching `apps/web/**` or `packages/**`                                                             |
| Source SBOM          | [`.github/workflows/sbom-source.yml`](.github/workflows/sbom-source.yml)           | PR opened, synchronised, or reopened; push to `main`; daily schedule; manual run (`workflow_dispatch`) |

**Typecheck** runs `pnpm typecheck` (`tsc` across every app/package, plus the root level `eslint.config.ts`/`vitest.config.ts`, which aren't part of any workspace project). Unlike Code Coverage, React Doctor and Source SBOM, this one is blocking by design: mark it as a required status check in branch protection once it's run at least once on this branch.

**Lint** runs `pnpm lint` (oxlint, then ESLint, in every workspace package), `pnpm lint:root` (the same on root-level files like `e2e/` and `playwright.config.ts`), `pnpm format:check` (Prettier) and `pnpm check:hook-parity` (see [Git hooks](#git-hooks)). **Terraform** runs `pnpm terraform:fmt` and `pnpm terraform:validate` against `infra/`, offline, so it needs no Azure credentials. Both are the CI twins of the pre-commit hook and are blocking: mark them as required status checks too.

**E2E** runs `scripts/e2e-ci.sh`, the same script as `pnpm test:e2e` and the pre-push hook, and uploads Playwright's HTML report as an artifact. It isn't a required check: it's the slowest job (it builds and starts the whole Docker stack), and the pre-push hook already runs it before code leaves a laptop.

**Code Coverage Report** runs the test suite, reads the coverage summary, and posts/updates a sticky PR comment with the line/statement/function/branch percentages. It warns below 70% but never fails the check — informational only, until the team is comfortable enough writing tests to enforce a floor.

**React Doctor (web)** runs [react-doctor](https://github.com/millionco/react-doctor) React performance/correctness linting on changed files. Non-blocking (`blocking: none`); it's a heads-up, not a gate. It's scoped to PRs touching `apps/web/**` or `packages/**` even though its actual scan target is fixed to `apps/web` — a `packages/**`-only PR triggers a deliberate no-op run rather than being silently skipped, since a shared package change can still affect `apps/web`'s render behavior.

**Source SBOM** writes a CycloneDX SBOM of the whole lockfile (dev deps included) and uploads it as a workflow artifact. Its **Vulnerability scan** job runs Grype on it and fails on fixable critical vulnerabilities (not a required check yet). The deploy workflows also produce an artifact SBOM (what actually ships) for every environment and scan it, report only. Nothing SBOM-related ever blocks a deploy. See [SBOM.md](SBOM.md) for toggles, suppressions, local runs, and the section to send to client IT teams.

These workflows run on pushes to environment branches:

| Workflow                     | File                                                                                         | Triggers                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Deploy API                   | [`.github/workflows/deploy-api.yml`](.github/workflows/deploy-api.yml)                       | Push to `develop`, `qa`, `staging` or `main`; manual run (`workflow_dispatch`) |
| Deploy web                   | [`.github/workflows/fe-web-deployment.yml`](.github/workflows/fe-web-deployment.yml)         | Push to `develop`, `qa`, `staging` or `main`; manual run (`workflow_dispatch`) |
| QA and Staging Release Notes | [`.github/workflows/staging-release-notes.yml`](.github/workflows/staging-release-notes.yml) | Push to `qa` or `staging`; manual run (`workflow_dispatch`)                    |

The deploy workflows build and deploy to Azure through a keyless (OIDC) identity. See [Deploying via GitHub Actions](infra/Readme.md#deploying-via-github-actions) for the GitHub Environments and secrets they need. The release notes workflow is described in [`release-notes/README.md`](release-notes/README.md).

When you add a workflow, add a row here, so these tables stay the one place that lists every workflow and what fires it.

### Branch protection rules

No branch is protected on this repository yet — the rules below are the convention to apply to `main` (and to `qa`/`staging` once those environments and their deploy workflows exist):

- At least 1 approving review required before merging
- Approvals are dismissed when new commits are pushed to the PR
- All conversations must be resolved before merging (this is what makes CodeRabbit's comments count, see [Pull request reviews](#pull-request-reviews))
- Required status checks must pass before merging: Typecheck, Lint and Terraform
- Force pushes are blocked
- Branch deletion is blocked
- Administrators are not exempt from any of the above rules

## Pull request reviews

Every PR into `main` gets an AI review from [CodeRabbit](https://coderabbit.ai) first, then a human review. CodeRabbit is set up in [`.coderabbit.yaml`](.coderabbit.yaml).

### The flow

1. Open a PR. Drafts are skipped, so CodeRabbit reviews when you mark it ready for review.
2. CodeRabbit reviews it. If it finds something, it leaves comments and a "request changes" review. Once the [GitHub settings for `main`](#github-settings-for-main) are on, the open comments block the merge: every conversation has to be resolved first. Don't count on the "request changes" review alone to block it; the conversation rule is the gate.
3. The author handles each comment: fix it, or reply with why not, then resolve the conversation. Reply `@coderabbitai` in a thread to talk to it. Once the comments are handled, CodeRabbit approves.
4. At least 1 human approves.

CodeRabbit stays quiet about anything CI already checks (types, tests, lint and format). It only comments on what a human reviewer would otherwise have to catch: secrets, security issues, workflow permissions, weakened tests and loosened tooling rules.

### GitHub settings for `main`

In **Settings → Branches → Add branch ruleset** (or a classic branch protection rule) for `main`, turn on:

- **Require a pull request before merging**, with **Required approvals: 1**
- **Dismiss stale pull request approvals when new commits are pushed**
- **Require conversation resolution before merging**, so every CodeRabbit conversation has to be resolved

CodeRabbit also needs its GitHub app installed on the repo, from the company CodeRabbit subscription.

### CODEOWNERS

[`.github/CODEOWNERS`](.github/CODEOWNERS) has placeholder handles (`@your-github-handle`). Replace them with the real GitHub users or teams that own each folder, so GitHub asks the right people to review. If you also turn on **Require review from Code Owners**, the owner of each changed folder must approve.

### Adjusting `.coderabbit.yaml` per project

- **Review instructions**: add or edit entries in `reviews.path_instructions`. Each one is a glob plus plain-language rules for files that match, for example your project's own conventions in `apps/api/**`.
- **Skipped files**: add `!glob` entries to `reviews.path_filters` for generated or vendored files.
- **Tools**: every tool in CodeRabbit's schema is listed in `reviews.tools`, because a tool left out defaults to on. A tool is only on when CI doesn't already run it (for example gitleaks, semgrep, zizmor, actionlint, shellcheck, hadolint). If you add a tool to CI, turn it off in `reviews.tools` so findings aren't reported twice. If CI stops running one, turn it on. When CodeRabbit adds a tool to its schema, add it to the list too.
- **Project docs**: `knowledge_base.code_guidelines.filePatterns` lists the docs CodeRabbit reads as review rules (`AGENTS.md`, `CONTEXT.md`, `Readme.md`, `.claude/skills/**`). Add any other conventions doc your project keeps.
- **Tone and strictness**: `tone_instructions` and `reviews.profile` (`chill` or `assertive`).

The first line of the file points editors at CodeRabbit's JSON schema, so VS Code (with the YAML extension) autocompletes and validates keys.

## Rationale

We believe that it's important to document the reason behind some of the key decisions we made in this project.

### Pnpm + TS + Turborepo

Overall, we aimed to create a codebase with as few dependencies as possible and minimal configuration. Our goal is for developers, even those with little or no experience with monorepos, to be able to clone the template and start coding immediately.

- **Pnpm:** Fast, efficient package management with great monorepo support.
- **Typescript:** Strong typing and tooling for safer code.
- **Turborepo:** Minimal configuration, easy setup, and less complexity than alternatives like NX.

### Docker

We want to ensure the code works everywhere and can be easily versioned. Developers will likely need to interact with a database server, so we want them to be able to simply add it to the Docker Compose files instead of installing it on their own systems.

### Vitest

We want to encourage developers to write tests more often. Most frontend developers have experience with Vitest, while most backend developers are familiar with Jest. We chose Vitest because its API is fully compatible with Jest, and it is much easier to use with ESM modules.
