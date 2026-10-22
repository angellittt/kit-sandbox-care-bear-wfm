#!/usr/bin/env node
// design-system-kit 0.28.21 · profile shadcn · kit file — fix it in the kit, not per client
/**
 * ds-validate.mjs — the contract's config validation.
 *
 *   node scripts/ds-validate.mjs               # config, token snapshot, wiring
 *   node scripts/ds-validate.mjs --preflight   # …and installed versions vs the tested range
 *   node scripts/ds-validate.mjs --repo <dir>  # validate another checkout
 *   node scripts/ds-validate.mjs --system <01-system.md>
 *                                             # compare with a live copy of the System
 *                                             # section instead of the committed snapshot
 *                                             # (systemIn, normally .ttt/system.md):
 *                                             # client-added ramps are listed there. A
 *                                             # difference is a "drift" warning;
 *                                             # scripts/ds-drift.test.mjs fails the
 *                                             # repo's tests on one
 *   node scripts/ds-validate.mjs --tokens <tokens.json>
 *                                             # check another token snapshot instead of
 *                                             # tokensIn (Setup's design phase, whose
 *                                             # tokens stay outside the checkout)
 *   node scripts/ds-validate.mjs --template <config.json> --tokens <tokens.json>
 *                                             # the kit's own templates ("{{…}}" allowed)
 *
 * Checks `.ttt/design-system.json` against the schema below (every key), the
 * token snapshot it points at (name grammar, aliases, cycles, colour formats,
 * the semantic tokens the profile's mapping needs, primitive ramps named by
 * role, never by hue), that the theme block's
 * `@source` resolves to the source root, that the global CSS has no style rule
 * outside a cascade layer (it would beat every Tailwind utility; read with
 * PostCSS, a dev dependency Setup adds), and that the repo's `kitVersion` is
 * no newer than these scripts. The app's locale module (`<aliases.lib>/locale.ts`)
 * isn't checked: since kit 0.13.0 it is plain app code, not part of the
 * design system. Every error names the field and says how to
 * fix it. Exits 1 on any error; warnings don't fail.
 *
 * Runs at the start of every skill run, and in CI through the repo's tests
 * (ds-drift.test.mjs).
 */

import { readFileSync, existsSync } from "node:fs"
import { join, resolve, dirname, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { createRequire } from "node:module"

/** The kit these scripts belong to. A repo may not claim a newer one. */
export const KIT_VERSION = "0.28.21"
const SCHEMA = "ttt-ds/1"
const PROFILE = "shadcn"

const HERE = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Profile: shadcn. The contract's token mapping table, in full.
// shadcn variable -> semantic token name.
// ---------------------------------------------------------------------------
/** The control set's tokens (Button, Input, InputGroup, Select, Combobox, Toggle, Textarea read them). */
export const CONTROL_SIZES = ["control-height-sm", "control-height-md", "control-height-lg", "control-padding-x"]
export const CONTROL_LABELS = ["control-label-sm", "control-label-md"]
/** The other families components read (z-index, icon sizes, line widths, breakpoints), by family. */
export const REQUIRED_FAMILIES = {
  layer: ["layer-sticky", "layer-overlay"],
  icon: ["icon-xs", "icon-sm", "icon-md", "icon-lg", "icon-xl"],
  border: ["border-width", "focus-ring-width", "focus-ring-offset"],
  breakpoint: ["breakpoint-sm", "breakpoint-md", "breakpoint-lg", "breakpoint-xl", "breakpoint-2xl"],
}

export const SHADCN_MAP = {
  background: "background-normal",
  foreground: "label-normal",
  card: "background-elevated",
  "card-foreground": "label-normal",
  popover: "background-elevated",
  "popover-foreground": "label-normal",
  primary: "primary-normal",
  "primary-foreground": "on-primary",
  // shadcn's "secondary" and "accent" are NEUTRAL greys, not brand colours.
  // The brand ones are exposed under brand-* below.
  secondary: "fill-normal",
  "secondary-foreground": "label-normal",
  muted: "fill-alternative",
  "muted-foreground": "label-alternative",
  accent: "fill-alternative",
  "accent-foreground": "label-normal",
  destructive: "status-negative",
  border: "line-normal",
  input: "line-strong",
  ring: "focus-ring",
  sidebar: "background-alternative",
  "sidebar-foreground": "label-normal",
  "sidebar-primary": "primary-normal",
  "sidebar-primary-foreground": "on-primary",
  "sidebar-accent": "fill-normal",
  "sidebar-accent-foreground": "label-normal",
  "sidebar-border": "line-normal",
  "sidebar-ring": "focus-ring",
  "chart-1": "chart-1",
  "chart-2": "chart-2",
  "chart-3": "chart-3",
  "chart-4": "chart-4",
  "chart-5": "chart-5",
};

/**
 * Tailwind-only colour names from the mapping table: brand colours, which
 * shadcn's own names would otherwise shadow, the status shorthands, and the
 * inverse/scrim roles. A client whose brand fills share one foreground points
 * `on-secondary` / `on-accent` at it in the design system, not here.
 */
export const ALIAS_COLORS = {
  "brand-secondary": "secondary-normal",
  "brand-secondary-foreground": "on-secondary",
  "brand-secondary-soft": "secondary-soft",
  "brand-secondary-text": "secondary-text",
  "brand-accent": "accent-normal",
  "brand-accent-foreground": "on-accent",
  "brand-accent-soft": "accent-soft",
  "brand-accent-text": "accent-text",
  positive: "status-positive",
  "positive-soft": "status-positive-soft",
  cautionary: "status-cautionary",
  "cautionary-soft": "status-cautionary-soft",
  negative: "status-negative",
  "negative-soft": "status-negative-soft",
  info: "status-info",
  "info-soft": "status-info-soft",
  inverse: "inverse-background",
  "inverse-foreground": "inverse-label",
  dimmer: "material-dimmer",
};

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** tsconfig/components.json allow comments; strip them without eating strings. */
function readJsonc(path) {
  const src = readFileSync(path, "utf8")
  let out = "", inStr = false, quote = "", i = 0
  while (i < src.length) {
    const c = src[i], next = src[i + 1]
    if (inStr) {
      out += c
      if (c === "\\") { out += next ?? ""; i += 2; continue }
      if (c === quote) inStr = false
      i++
      continue
    }
    if (c === '"' || c === "'") { inStr = true; quote = c; out += c; i++; continue }
    if (c === "/" && next === "/") { while (i < src.length && src[i] !== "\n") i++; continue }
    if (c === "/" && next === "*") { i += 2; while (i < src.length && !(src[i] === "*" && src[i + 1] === "/")) i++; i += 2; continue }
    out += c
    i++
  }
  return JSON.parse(out.replace(/,(\s*[}\]])/g, "$1"))
}

const semver = (v) => /^(\d+)\.(\d+)\.(\d+)/.exec(String(v))?.slice(1).map(Number)
/** -1, 0 or 1; null if either side isn't a version. */
export function compareVersions(a, b) {
  const x = semver(a), y = semver(b)
  if (!x || !y) return null
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1
  return 0
}

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v)
const isUrl = (v) => {
  try { return ["https:", "http:"].includes(new URL(v).protocol) } catch { return false }
}

/** A token name the design system type accepts. */
export const TOKEN_NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/
const ALIAS = /^\{([^}]+)\}$/
/** Colour forms the design system type reads (no nested functions, no named colours). */
const COLOUR = [
  /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([^()]*\)$/i,
]
export const isColour = (v) => COLOUR.some((re) => re.test(String(v).trim()))
const LENGTH = /^-?(\d+\.?\d*|\.\d+)(px|rem|em|%)?$/

/** The contract's standard primitive ramps. A client may add more, named by role. */
export const STANDARD_RAMPS = ["brand-primary", "brand-secondary", "brand-accent", "neutral", "positive", "cautionary", "negative", "info"]
/** Words that name a hue, not a role. A ramp name containing one is rejected. */
const HUE_WORDS = new Set(("red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple " +
  "fuchsia pink rose magenta plum lavender lilac mauve maroon crimson scarlet tomato coral salmon peach " +
  "gold golden mustard olive mint navy aqua turquoise brown tan beige cream ivory grey gray slate zinc " +
  "stone charcoal black white silver ruby sapphire jade cobalt ochre sand").split(" "))
/** "data-50" → "data"; "neutral-0" → "neutral"; a primitive with no step is its own ramp. */
export const rampOf = (name) => name.replace(/-\d+(\.\d+)?$/, "")
/** A primitive is a colour token whose usage text starts with "Primitive" (contract, Token tiers). */
const isPrimitive = (t) => (t?.usage ?? "").startsWith("Primitive")
/** The hue word in a ramp name, if any. */
export const hueIn = (ramp) => ramp.split(/[-_.]/).find((w) => HUE_WORDS.has(w.toLowerCase())) ?? null

/**
 * The ramps the System section's client-specific choices name: every `code`
 * span in the "**…-specific choices**" block (up to the next bold heading).
 */
export function listedInSystem(markdown) {
  const m = /\*\*[^*\n]*-specific choices\*\*([\s\S]*?)(?=\n\*\*[^*\n]+\*\*|$)/.exec(markdown)
  return new Set([...(m?.[1] ?? "").matchAll(/`([^`]+)`/g)].map((x) => x[1]))
}

// ---------------------------------------------------------------------------
// The config schema: every key, what it must be, how to fix it
// ---------------------------------------------------------------------------

const str = (fix) => (v) => typeof v === "string" && v.length > 0 ? null : fix
const CONFIG_SCHEMA = {
  designSystem: { required: true, check: (v) => isUrl(v) ? null : "set it to the design system's claude.ai link" },
  tracker: { required: true, check: (v) => isUrl(v) ? null : "set it to the project's ClickUp list URL" },
  schema: { required: true, check: (v) => v === SCHEMA ? null : `this kit reads schema "${SCHEMA}"; the design system and repo must agree` },
  profile: { required: true, check: (v) => v === PROFILE ? null : `these scripts are profile "${PROFILE}"; install the kit's code for "${v}" instead` },
  kitVersion: { required: true, check: (v) => semver(v) ? null : 'set it to the kit version the repo was set up or last synced with, e.g. "0.1.1"' },
  tokensIn: { required: true, check: str('set it to the token snapshot path, normally ".ttt/tokens.json"') },
  systemIn: { required: false, check: str('set it to the System section snapshot path, normally ".ttt/system.md"') },
  tokensOut: { required: true, check: (v) => typeof v === "string" && v.endsWith(".css") ? null : 'set it to the generated token file, e.g. "src/styles/ds-tokens.css"' },
  lastSynced: { required: true, check: (v) => typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d(:\d\d)?(\.\d+)?Z$/.test(v) && !isNaN(Date.parse(v)) ? null : 'use an RFC 3339 UTC time from the system clock, e.g. "2026-10-07T18:01:26Z"' },
  typeClassPrefix: { required: true, check: (v) => typeof v === "string" && /^[a-z][a-z0-9-]*-$/.test(v) ? null : 'lowercase, ending in "-", e.g. "type-"' },
  namespace: { required: true, check: (v) => typeof v === "string" && /^[A-Z][A-Za-z0-9_$]*$/.test(v) ? null : 'a PascalCase JavaScript identifier for the bundle global, e.g. "Acme"' },
  bundleExtras: { required: false, check: (v) => isObject(v) && Object.values(v).every((a) => Array.isArray(a) && a.every((n) => typeof n === "string" && /^[A-Za-z_$][\w$]*$/.test(n))) ? null : 'map a module to the export names the bundle adds, e.g. {"sonner": ["toast"]}' },
  componentFiles: { required: false, check: (v) => isObject(v) && Object.entries(v).every(([k, a]) => /^[A-Z][A-Za-z0-9]*$/.test(k) && Array.isArray(a) && a.length && a.every((f) => typeof f === "string" && /^[a-z0-9-]+\.tsx$/.test(f))) ? null : 'map each PascalCase component to its .tsx files, e.g. {"Input": ["input.tsx", "label.tsx"]}' },
  framework: { required: false, check: (v) => v in FRAMEWORKS ? null : `one of ${Object.keys(FRAMEWORKS).map((f) => `"${f}"`).join(", ")}; leave it out for "next"` },
  contrast: { required: false, check: (v) => isObject(v) ? null : 'an object: { "intentional": [{ "foreground", "background"?, "reason" }] }' },
  usingInCode: { required: false, check: (v) => isObject(v) ? null : 'an object: { "notes": ["…"] }' },
  // Setup under way. "template": a starter template on the kit's default look,
  // not yet named for a project (/ds-setup start adopts it). "awaiting-design":
  // the start phase is done and the design phase hasn't created the design
  // system yet. Finish removes it with the link in place.
  setup: { required: false, check: (v) => v === AWAITING_DESIGN || v === TEMPLATE ? null : `"${TEMPLATE}" in a starter template, "${AWAITING_DESIGN}" while Setup waits on its design phase; /ds-setup finish removes it` },
}

/** The config's `setup` value between Setup's start phase and its finish. */
export const AWAITING_DESIGN = "awaiting-design"
/** The config's `setup` value in a starter template, before a project adopts it. */
export const TEMPLATE = "template"
/** Keys a config may leave out while Setup is under way: nothing exists for them yet. */
const NOT_YET = {
  [TEMPLATE]: new Set(["designSystem", "tracker", "namespace"]),
  [AWAITING_DESIGN]: new Set(["designSystem"]),
}

// ---------------------------------------------------------------------------

/** A Setup placeholder such as "{{NAMESPACE}}" — legal only in the kit's config template. */
const isPlaceholder = (v) => typeof v === "string" && /^\{\{[A-Z_]+\}\}$/.test(v)

/** Every key of the config against the schema. `placeholders` accepts "{{…}}" values. */
function checkConfig(config, err, { placeholders = false } = {}) {
  for (const [key, rule] of Object.entries(CONFIG_SCHEMA)) {
    if (!(key in config)) {
      // No design system (and, in a template, no project) exists yet.
      if (NOT_YET[config.setup]?.has(key)) continue
      if (rule.required) err(key, "is missing", rule.check(undefined) ?? "add it")
      continue
    }
    if (placeholders && isPlaceholder(config[key])) continue
    const problem = rule.check(config[key])
    if (problem) err(key, `is ${JSON.stringify(config[key])}`, problem)
  }
  for (const key of Object.keys(config)) {
    if (key === "settings") continue // moved to the app's locale module in kit 0.5.0; validate() warns
    if (!(key in CONFIG_SCHEMA)) err(key, "isn't a key this kit knows", `remove it, or check its spelling against: ${Object.keys(CONFIG_SCHEMA).join(", ")}`)
  }
  if (isObject(config.contrast)) {
    const list = config.contrast.intentional ?? []
    if (!Array.isArray(list)) err("contrast.intentional", "isn't a list", "a list of { foreground, background?, reason }")
    else list.forEach((x, i) => {
      if (!isObject(x) || typeof x.foreground !== "string" || typeof x.reason !== "string" || !x.reason.trim())
        err(`contrast.intentional[${i}]`, `is ${JSON.stringify(x)}`, 'give a foreground token and a reason, e.g. { "foreground": "label-disable", "reason": "…" }')
    })
    for (const key of Object.keys(config.contrast)) if (key !== "intentional") err(`contrast.${key}`, "isn't a key this kit knows", 'the only key is "intentional"')
  }
  if (isObject(config.usingInCode)) {
    const notes = config.usingInCode.notes ?? []
    if (!Array.isArray(notes) || !notes.every((n) => typeof n === "string"))
      err("usingInCode.notes", "isn't a list of strings", "one Markdown paragraph per entry")
    for (const key of Object.keys(config.usingInCode)) if (key !== "notes") err(`usingInCode.${key}`, "isn't a key this kit knows", 'the only key is "notes"')
  }
}

export function validate(repo, { preflight = false, testedRange, system, tokens: tokensOverride } = {}) {
  const errors = []
  const warnings = []
  const notes = []
  const err = (field, message, fix) => errors.push({ field, message, fix })
  // kind "drift": code and the design system's System section disagree.
  const warn = (field, message, fix, kind) => warnings.push({ field, message, fix, ...(kind && { kind }) })

  // ---- config --------------------------------------------------------------
  const configPath = join(repo, ".ttt/design-system.json")
  if (!existsSync(configPath)) {
    // Setup's pre-flight runs before the config exists, so there a missing config
    // is expected (a note), and the lockfile check still applies.
    if (!preflight) err(".ttt/design-system.json", "not found", "this repo isn't connected to a design system; Setup writes it")
    else {
      notes.push(".ttt/design-system.json not written yet — expected before Setup's code step")
      checkTestedRange(repo, testedRange, err, undefined, warn, notes)
    }
    return { errors, warnings, notes }
  }
  let config
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"))
  } catch (e) {
    err(".ttt/design-system.json", `isn't valid JSON (${e.message})`, "fix the syntax")
    return { errors, warnings, notes }
  }

  checkConfig(config, err)
  const setupUnderWay = config.setup === AWAITING_DESIGN || config.setup === TEMPLATE
  if (config.setup === TEMPLATE) notes.push("A starter template on the kit's default look: no project, design system or System section yet (/ds-setup start adopts it for a project)")
  else if (setupUnderWay) notes.push("Setup is waiting on its design phase: no design system or System section yet (/ds-setup design, then /ds-setup finish)")
  if ("settings" in config)
    warn("settings", "is in .ttt/design-system.json; since kit 0.5.0 locale, week start and date format live in the app's locale module", "copy the values into <aliases.lib>/locale.ts (wiring/locale.ts) and remove settings from the config")

  // ---- kit version -----------------------------------------------------------
  if (semver(config.kitVersion)) {
    const cmp = compareVersions(config.kitVersion, KIT_VERSION)
    if (cmp > 0) err("kitVersion", `is ${config.kitVersion}, newer than these scripts (${KIT_VERSION})`, `copy the kit ${config.kitVersion} scripts into scripts/, or install that kit version`)
    else if (cmp < 0) warn("kitVersion", `is ${config.kitVersion}; these scripts are ${KIT_VERSION}`, `set it to ${KIT_VERSION} once the rest of the kit's files are synced`)
  }
  // Every kit script in the repo should name the same kit version.
  for (const name of ["ds-tokens", "ds-pack-react", "ds-build-bundle", "ds-styling-maps", "ds-types", "ds-validate", "ds-contrast"]) {
    const p = join(repo, "scripts", `${name}.mjs`)
    if (!existsSync(p)) continue
    const v = /design-system-kit (\d+\.\d+\.\d+)/.exec(readFileSync(p, "utf8").slice(0, 400))?.[1]
    if (!v) warn(`scripts/${name}.mjs`, "doesn't name a kit version", "copy it from the kit unchanged")
    else if (v !== KIT_VERSION) warn(`scripts/${name}.mjs`, `is kit ${v}; ds-validate is ${KIT_VERSION}`, "copy all kit scripts from one kit version")
  }

  // ---- System section snapshot -------------------------------------------------
  // The design system's 01-system.md, committed beside the token snapshot so the
  // drift checks run in CI. --system (a live copy) wins over it.
  if (!system && typeof config.systemIn === "string") {
    const p = join(repo, config.systemIn)
    if (existsSync(p)) system = p
    // A template says nothing more: its own note already says there's no System section yet.
    else if (config.setup === AWAITING_DESIGN) notes.push(`${config.systemIn} not written yet — /ds-setup finish snapshots it`)
    else if (!setupUnderWay) warn("systemIn", `points at ${config.systemIn}, which doesn't exist`, "run /ds-apply tokens to write the snapshot (Setup writes the first one)")
  }

  // ---- token snapshot ----------------------------------------------------------
  if (tokensOverride || typeof config.tokensIn === "string") {
    const tokensPath = tokensOverride ?? join(repo, config.tokensIn)
    const tokensName = tokensOverride ? relative(repo, tokensOverride) : config.tokensIn
    if (!existsSync(tokensPath)) err(tokensOverride ? "--tokens" : "tokensIn", `points at ${tokensName}, which doesn't exist`, tokensOverride ? "check the path" : "run /ds-apply tokens to write the snapshot")
    else {
      let tokens
      try { tokens = JSON.parse(readFileSync(tokensPath, "utf8")) }
      catch (e) { err(tokensName, `isn't valid JSON (${e.message})`, "re-pull it from the design system") }
      if (tokens) {
        validateTokens(tokens, tokensName, err, warn)
        checkClientRamps(tokens, tokensName, system, warn, notes)
      }
    }
  }

  // ---- the token file was generated from this snapshot -------------------------
  if (typeof config.tokensOut === "string" && existsSync(join(repo, config.tokensOut))) {
    const synced = /Snapshot synced: (\S+)/.exec(readFileSync(join(repo, config.tokensOut), "utf8").slice(0, 600))?.[1]
    if (synced && config.lastSynced && synced !== config.lastSynced)
      warn(config.tokensOut, `says "Snapshot synced: ${synced}" but lastSynced is ${config.lastSynced}`, "regenerate it with the plugin's ds-tokens.mjs (/ds-apply tokens; set lastSynced before regenerating)")
  }

  // ---- wiring: @source resolves to the source root -------------------------------
  checkSource(repo, err, warn)

  // ---- wiring: no global CSS outside a layer -------------------------------------
  checkLayers(repo, err)

  // ---- componentFiles name real files --------------------------------------------
  const ui = uiDir(repo)
  if (ui && isObject(config.componentFiles)) {
    for (const [comp, files] of Object.entries(config.componentFiles)) {
      if (!Array.isArray(files)) continue
      for (const f of files) if (typeof f === "string" && !existsSync(join(ui, f)))
        err(`componentFiles.${comp}`, `lists ${f}, which isn't in ${relative(repo, ui)}`, "fix the file name or remove the entry")
    }
  }

  // ---- pre-flight: installed versions vs the tested range --------------------------
  if (preflight) checkTestedRange(repo, testedRange, err, config.framework ?? "next", warn, notes)

  return { errors, warnings, notes }
}

function validateTokens(tokens, file, err, warn) {
  const where = (name) => `${file} › ${name}`
  if (!isObject(tokens.color) || !Array.isArray(tokens.color.tokens)) {
    err(`${file} › color`, "has no tokens list", 'families are { "tokens": [{ "name", "value", "usage" }] } lists, not name → value maps')
    return
  }
  const themes = (tokens.color.themes ?? []).map((t) => t?.id)
  if (!themes.length || themes.some((t) => typeof t !== "string")) err(`${file} › color.themes`, "declares no theme ids", 'list themes as [{ "id": "light", "name": "Light" }, …]')

  // Design-only themes (`"code": false`, the Wireframe theme): in the design
  // system and Figma, never in the app's CSS.
  const designOnly = new Set()
  for (const t of tokens.color.themes ?? []) {
    if (t?.code === undefined) continue
    if (typeof t.code !== "boolean") err(`${file} › color.themes › ${t?.id}`, `has "code": ${JSON.stringify(t.code)}`, 'use "code": false for a design-only theme, or leave it out')
    else if (t.code === false) designOnly.add(t.id)
  }
  if (designOnly.has(themes[0])) err(`${file} › color.themes`, `starts with "${themes[0]}", a design-only theme`, "put a theme the app renders first: it is the default, and the theme every missing value falls back to")
  // A design-only theme with a gap would fall back to the first theme's brand colour.
  for (const t of tokens.color.tokens) {
    if (!isObject(t?.value)) continue
    for (const id of designOnly) if (!(id in t.value)) err(where(t.name), `has no "${id}" value`, `give it one; without it, the ${id} theme shows the ${themes[0]} colour`)
  }
  for (const t of tokens.shadow?.tokens ?? []) {
    if (!isObject(t?.value)) continue
    for (const id of designOnly) if (!(id in t.value)) err(where(t.name), `has no "${id}" value`, `give it one ("none" for a flat theme)`)
  }

  // Names: grammar and uniqueness across every family but type.
  const all = new Map()
  for (const [family, group] of Object.entries(tokens)) {
    if (family === "type" || !isObject(group) || !Array.isArray(group.tokens)) continue
    for (const t of group.tokens) {
      if (!TOKEN_NAME.test(t?.name ?? "")) { err(where(t?.name ?? "(unnamed)"), `in ${family} isn't a valid token name`, "start with a letter or digit; then letters, digits, _ . - (no spaces or /), at most 64 characters"); continue }
      if (all.has(t.name)) err(where(t.name), `appears in both ${all.get(t.name)} and ${family}`, "rename one; a duplicate is dropped by the design system")
      else all.set(t.name, family)
    }
  }

  // Colours: per-theme values, alias targets, formats.
  const colours = new Map(tokens.color.tokens.filter((t) => TOKEN_NAME.test(t?.name ?? "")).map((t) => [t.name, t]))
  const valuesOf = (t) => (isObject(t.value) ? t.value : { [themes[0]]: t.value })
  for (const t of colours.values()) {
    if (t.value == null) { err(where(t.name), "has no value", "give it a colour or an {alias}"); continue }
    if (isObject(t.value)) for (const k of Object.keys(t.value)) if (!themes.includes(k)) err(where(t.name), `has a value for theme "${k}", which color.themes doesn't declare`, `use one of: ${themes.join(", ")}`)
    for (const [theme, v] of Object.entries(valuesOf(t))) {
      const m = ALIAS.exec(String(v).trim())
      if (m) {
        if (!colours.has(m[1])) err(where(t.name), `(${theme}) aliases {${m[1]}}, which isn't a colour token`, "point it at an existing colour token or use a literal")
        else if (m[1] === t.name) err(where(t.name), `(${theme}) aliases itself`, "point it at a primitive")
      } else if (!isColour(v)) {
        err(where(t.name), `(${theme}) is ${JSON.stringify(v)}, not a colour the design system reads`, "use hex, rgb(), hsl() or oklch() with no function inside; no named colours, var() or color-mix()")
      }
    }
  }
  // Cycles, per theme.
  for (const theme of themes) {
    const next = (name) => {
      const t = colours.get(name)
      if (!t) return null
      const v = valuesOf(t)[theme] ?? valuesOf(t)[themes[0]]
      return ALIAS.exec(String(v ?? "").trim())?.[1] ?? null
    }
    const reported = new Set()
    for (const start of colours.keys()) {
      const path = [start]
      let cur = next(start)
      while (cur && colours.has(cur)) {
        if (path.includes(cur)) {
          const cycle = path.slice(path.indexOf(cur)).concat(cur)
          const key = [...cycle].sort().join()
          if (!reported.has(key)) {
            reported.add(key)
            err(where(cur), `(${theme}) is in an alias cycle: ${cycle.join(" → ")}`, "break the cycle by pointing one of them at a primitive")
          }
          break
        }
        path.push(cur)
        cur = next(cur)
      }
    }
  }

  // Primitive ramps: named by role, never by hue.
  const ramps = new Set([...colours.values()].filter(isPrimitive).map((t) => rampOf(t.name)))
  for (const ramp of ramps) {
    const hue = hueIn(ramp)
    if (hue) err(where(`${ramp}-*`), `is a ramp named by hue ("${hue}")`, `name it by the role it plays (e.g. "data" for chart colours), in the design system, then re-pull; standard ramps are ${STANDARD_RAMPS.join(", ")}`)
  }

  // The semantic tokens the profile's mapping needs.
  const required = new Set([...Object.values(SHADCN_MAP), ...Object.values(ALIAS_COLORS)])
  for (const name of required) if (!colours.has(name))
    err(where(name), "is missing; the profile's token mapping needs it", "add it in the design system (a semantic token aliasing a primitive), then re-pull")

  // Scalars.
  for (const family of ["spacing", "radius"]) {
    for (const t of tokens[family]?.tokens ?? []) if (!LENGTH.test(String(t.value).trim()))
      err(where(t.name), `is ${JSON.stringify(t.value)}, not a length`, "use px, rem, em, % or a plain number")
  }
  if (!(tokens.spacing?.tokens ?? []).some((t) => t.name === "space-1"))
    warn(`${file} › space-1`, "is missing", "Tailwind's spacing base is set from space-1; without it utilities use Tailwind's default 0.25rem")
  // The control set's tokens: every component in it reads them, so each must be there.
  const controlTokens = new Map((tokens.control?.tokens ?? []).map((t) => [t.name, t]))
  const typeStyles = new Set((tokens.type?.groups ?? []).flatMap((g) => (g.styles ?? []).map((s) => s.name)))
  for (const name of CONTROL_SIZES) {
    const t = controlTokens.get(name)
    if (!t) err(where(name), "is missing; the control set's components need it", "add the control family in the design system (the kit's template has its default values), then re-pull")
    else if (!LENGTH.test(String(t.value).trim())) err(where(name), `is ${JSON.stringify(t.value)}, not a length`, "use px or rem, such as 32px")
  }
  for (const name of CONTROL_LABELS) {
    const t = controlTokens.get(name)
    const m = t && /^\{([^}]+)\}$/.exec(String(t.value).trim())
    if (!t) err(where(name), "is missing; the control set's components need it", "add the control family in the design system (the kit's template has its default values), then re-pull")
    else if (!m || !typeStyles.has(m[1])) err(where(name), `is ${JSON.stringify(t.value)}, not a style in the type scale`, "alias a type style, such as {label-1}")
  }
  const h = (n) => parseFloat(controlTokens.get(n)?.value)
  if (h("control-height-sm") >= h("control-height-md") || h("control-height-md") >= h("control-height-lg"))
    err(where("control-height-*"), "aren't in order", "keep control-height-sm < control-height-md < control-height-lg")
  // The families components read: present, each value of its kind, the breakpoints in order.
  for (const [family, names] of Object.entries(REQUIRED_FAMILIES)) {
    const have = new Map((tokens[family]?.tokens ?? []).map((t) => [t.name, t]))
    for (const name of names) {
      const t = have.get(name)
      if (!t) { err(where(name), `is missing; the components need the ${family} family`, `add the ${family} family in the design system (the kit's template has its default values), then re-pull`); continue }
      const v = String(t.value).trim()
      if (family === "layer" ? !/^\d+$/.test(v) : !LENGTH.test(v)) err(where(name), `is ${JSON.stringify(t.value)}, not ${family === "layer" ? "a whole number (a z-index)" : "a length"}`, family === "layer" ? "use a number such as 50" : "use px or rem")
    }
  }
  const bps = REQUIRED_FAMILIES.breakpoint.map((n) => (tokens.breakpoint?.tokens ?? []).find((t) => t.name === n)?.value).filter(Boolean)
  if (bps.length === REQUIRED_FAMILIES.breakpoint.length) {
    const units = new Set(bps.map((v) => /[a-z]+$/.exec(String(v).trim())?.[0]))
    if (units.size > 1) err(where("breakpoint-*"), `mix units (${[...units].join(", ")})`, "give every breakpoint the same unit (rem, as Tailwind's): Tailwind sorts them by value")
    else if (bps.some((v, i) => i && parseFloat(v) <= parseFloat(bps[i - 1]))) err(where("breakpoint-*"), "aren't in order", "keep sm < md < lg < xl < 2xl")
  }
  // More contrast: each override names a token that exists, and is an alias to one or a length.
  const known = new Set(Object.values(tokens).flatMap((g) => (isObject(g) && Array.isArray(g.tokens) ? g.tokens.map((t) => t.name) : [])))
  for (const [name, value] of Object.entries(tokens.contrastMore?.overrides ?? {})) {
    const m = /^\{([^}]+)\}$/.exec(String(value).trim())
    if (!known.has(name)) err(`${file} › contrastMore.${name}`, "isn't a token", "override an existing token, such as line-normal")
    else if (m ? !known.has(m[1]) : !LENGTH.test(String(value).trim())) err(`${file} › contrastMore.${name}`, `is ${JSON.stringify(value)}`, "alias another token ({line-strong}) or give a length (3px)")
    else if (m && m[1] === name) err(`${file} › contrastMore.${name}`, "aliases itself", "point it at a stronger token")
  }
  for (const g of tokens.type?.groups ?? []) {
    for (const s of g.styles ?? []) if (s.mobileFontSize !== undefined && !LENGTH.test(String(s.mobileFontSize)))
      err(`${file} › type.${s.name}`, `has mobileFontSize ${JSON.stringify(s.mobileFontSize)}`, "use a length such as 28px, or leave it out")
  }
  for (const g of tokens.type?.groups ?? []) {
    if (!(g.family in (tokens.type.families ?? {}))) err(`${file} › type.groups.${g.name}`, `uses family "${g.family}", which type.families doesn't define`, "add the family or fix the name")
    for (const s of g.styles ?? []) if (!LENGTH.test(String(s.fontSize ?? "")))
      err(`${file} › type.${s.name}`, `has fontSize ${JSON.stringify(s.fontSize)}`, "use a length such as 15px")
  }
}

/**
 * Client-added ramps (any primitive ramp beyond the standard roles) must be
 * recorded in the System section's client-specific choices. With `system`
 * (a copy of the design system's 01-system.md) each one not named there is a
 * warning; without it the check can't run and says so as a note.
 */
function checkClientRamps(tokens, file, system, warn, notes) {
  const prims = (tokens.color?.tokens ?? []).filter((t) => TOKEN_NAME.test(t?.name ?? "") && isPrimitive(t))
  const added = [...new Set(prims.map((t) => rampOf(t.name)))].filter((r) => !STANDARD_RAMPS.includes(r) && !hueIn(r))
  if (!added.length) return
  if (!system) {
    notes.push(`client-added ramps ${added.join(", ")} — not checked against the System section (set systemIn, or pass --system <01-system.md>)`)
    return
  }
  if (!existsSync(system)) { warn("--system", `points at ${system}, which doesn't exist`, "save the design system's project/01-system.md and pass its path"); return }
  const listed = listedInSystem(readFileSync(system, "utf8"))
  for (const ramp of added) if (!listed.has(ramp))
    warn(`${file} › ${ramp}-*`, "is a client-added ramp the System section doesn't list", `add it to the System section's client-specific choices, e.g. "A \`${ramp}\` ramp for …"`, "drift")
}

function uiDir(repo) {
  const cj = join(repo, "components.json"), tc = join(repo, "tsconfig.json")
  if (!existsSync(cj) || !existsSync(tc)) return null
  const alias = readJsonc(cj).aliases?.ui ?? "@/components/ui"
  return resolveAlias(repo, alias)
}

function resolveAlias(repo, spec) {
  const paths = readJsonc(join(repo, "tsconfig.json")).compilerOptions?.paths ?? {}
  for (const [pattern, targets] of Object.entries(paths)) {
    const prefix = pattern.replace(/\*$/, "")
    if (!spec.startsWith(prefix)) continue
    const target = String(targets[0]).replace(/\*$/, "")
    return resolve(repo, target + spec.slice(prefix.length))
  }
  return null
}

/** The source root: where tsconfig's "@/*" (the first wildcard path) points. */
export function sourceRoot(repo) {
  const tc = join(repo, "tsconfig.json")
  if (!existsSync(tc)) return null
  const paths = readJsonc(tc).compilerOptions?.paths ?? {}
  const first = Object.entries(paths).find(([p]) => p.endsWith("/*"))
  if (!first) return null
  return resolve(repo, String(first[1][0]).replace(/\/?\*$/, ""))
}

function checkSource(repo, err, warn) {
  const cj = join(repo, "components.json")
  if (!existsSync(cj)) { err("components.json", "not found", "run `shadcn init`"); return }
  const cssRel = readJsonc(cj).tailwind?.css
  if (!cssRel) { err("components.json › tailwind.css", "is missing", "set it to the global CSS path"); return }
  const cssPath = join(repo, cssRel)
  if (!existsSync(cssPath)) { err("components.json › tailwind.css", `points at ${cssRel}, which doesn't exist`, "fix the path"); return }
  const root = sourceRoot(repo)
  if (!root) { warn("tsconfig.json › paths", "has no wildcard alias", "add \"@/*\" so the source root can be checked"); return }
  const css = readFileSync(cssPath, "utf8").replace(/\/\*[\s\S]*?\*\//g, "")
  const sources = [...css.matchAll(/@source\s+(?!not\b)["']([^"']+)["']/g)].map((m) => m[1])
  const want = relative(dirname(cssPath), root) || "."
  if (!sources.length) {
    err(`${cssRel} › @source`, "is missing", `add \`@source "${want.startsWith(".") ? want : "./" + want}";\` — the theme block declares the scan root explicitly`)
    return
  }
  const hits = sources.filter((s) => resolve(dirname(cssPath), s) === root)
  if (!hits.length) {
    err(`${cssRel} › @source`, `resolves to ${sources.map((s) => relative(repo, resolve(dirname(cssPath), s)) || ".").join(", ")}, not the source root ${relative(repo, root) || "."}`, `set it to "${want.endsWith("/") ? want : want + "/"}" (relative to ${cssRel})`)
  }
}

/**
 * What may stay at the top level of the global CSS. Tailwind v4 puts its
 * utilities in `@layer utilities`, and an unlayered style rule beats every
 * layered one whatever its specificity, so a reset left at the top level
 * (`*:not(dialog) { margin: 0 }`, `button { font: inherit }`) silently wins
 * over `mx-2` and `text-sm`. Everything else — a style rule, or an `@media` /
 * `@supports` block holding one — goes in `@layer base`, in its order. The
 * at-rules below configure Tailwind or don't compete with utilities. The
 * kit's own unlayered CSS (the fonts file's `:root`, the token file) comes in
 * through `@import`, which this doesn't follow.
 */
export const TOP_LEVEL_AT_RULES = new Set([
  "charset", "import", "layer", "theme", "source", "custom-variant", "variant", "utility",
  "plugin", "config", "font-face", "keyframes", "property",
])

/** PostCSS as the app has it, or as the script's own folder reaches it (the kit's CI). */
export function loadPostcss(repo) {
  for (const from of [import.meta.url, join(repo, "package.json")]) {
    try { return createRequire(from)("postcss") } catch { /* not reachable from here: try the next folder */ }
  }
  return null
}

/**
 * The global CSS's style rules outside any layer, in order: `{ selector, line }`,
 * where an `@media` / `@supports` (or other) block holding style rules reads as
 * `@media (…) { html }`. Comments and the allowed at-rules are skipped.
 */
export function unlayeredRules(css, postcss) {
  const root = postcss.parse(css)
  const found = []
  for (const node of root.nodes) {
    if (node.type === "rule") found.push({ selector: node.selector.replace(/\s+/g, " "), line: node.source?.start?.line })
    else if (node.type === "atrule" && !TOP_LEVEL_AT_RULES.has(node.name.toLowerCase())) {
      // Style rules inside the block, unless a nested @layer already holds them.
      const inner = []
      const walk = (n) => n.each?.((c) => {
        if (c.type === "rule") inner.push(c.selector.replace(/\s+/g, " "))
        else if (c.type === "atrule" && c.name.toLowerCase() !== "layer") walk(c)
      })
      walk(node)
      inner.splice(3)
      if (inner.length) found.push({ selector: `@${node.name} ${node.params} { ${inner.join("; ")} }`.replace(/\s+/g, " "), line: node.source?.start?.line })
    }
  }
  return found
}

function checkLayers(repo, err) {
  const cj = join(repo, "components.json")
  if (!existsSync(cj)) return // checkSource reported it
  const cssRel = readJsonc(cj).tailwind?.css
  if (!cssRel || !existsSync(join(repo, cssRel))) return
  const postcss = loadPostcss(repo)
  if (!postcss) {
    // Declared but not loadable: the packages were never installed in this checkout, not a missing dependency.
    const pkg = existsSync(join(repo, "package.json")) ? readJsonc(join(repo, "package.json")) : {}
    if (pkg.dependencies?.postcss || pkg.devDependencies?.postcss)
      err("package postcss", "is in package.json but not installed, so the global CSS's layers can't be checked", "install the repo's packages first (`pnpm install`, or the repo's package manager), then run this again")
    else
      err("package postcss", "isn't installed, so the global CSS's layers can't be checked", "install it as a dev dependency (`pnpm add -D postcss@8.5.28`, or the repo's package manager) — Setup and the kit 0.21.0 upgrade add it")
    return
  }
  let rules
  try { rules = unlayeredRules(readFileSync(join(repo, cssRel), "utf8"), postcss) }
  catch (e) { err(cssRel, `can't be parsed (${e.reason ?? e.message})`, "fix the syntax"); return }
  for (const { selector, line } of rules)
    err(`${cssRel}${line ? `:${line}` : ""} › ${selector}`, "is unlayered and beats every utility (Tailwind v4)", "move it into `@layer base { … }`, keeping its place in the order; change no selector or declaration")
}

/**
 * The version of a package as the app sees it, for any package manager and
 * for an app inside a workspace (e.g. `apps/web` in a pnpm monorepo):
 *
 * 1. an npm `package-lock.json` in the app's folder or any folder above it —
 *    the app's own entry first (`apps/web/node_modules/x` in a workspace
 *    lock), then the hoisted one (`node_modules/x`);
 * 2. otherwise the installed package itself, found the way Node resolves it:
 *    `node_modules/<name>/package.json` in the app's folder, then each
 *    folder above it (pnpm's symlinks, Yarn without Plug'n'Play, devDeps
 *    hoisted to the workspace root).
 *
 * null when it isn't installed anywhere the app can reach.
 */
export function installedVersion(app, name) {
  const root = resolve(app)
  for (let dir = root; ; dir = dirname(dir)) {
    const lock = join(dir, "package-lock.json")
    if (existsSync(lock)) {
      const pkgs = JSON.parse(readFileSync(lock, "utf8")).packages ?? {}
      const rel = relative(dir, root).split("\\").join("/")
      const v = (rel && pkgs[`${rel}/node_modules/${name}`]?.version) || pkgs[`node_modules/${name}`]?.version
      if (v) return v
      break
    }
    if (dirname(dir) === dir) break
  }
  for (let dir = root; ; dir = dirname(dir)) {
    const pkg = join(dir, "node_modules", name, "package.json")
    if (existsSync(pkg)) return JSON.parse(readFileSync(pkg, "utf8")).version ?? null
    if (dirname(dir) === dir) return null
  }
}

/** The frameworks this profile supports, and the package that marks each. */
export const FRAMEWORKS = { next: "next", vite: "vite" }

/** The app's framework from its own package.json (pre-flight runs before there's a config). */
export function detectFramework(app) {
  const p = join(app, "package.json")
  if (!existsSync(p)) return null
  const pkg = JSON.parse(readFileSync(p, "utf8"))
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const found = Object.entries(FRAMEWORKS).filter(([, marker]) => marker in deps).map(([name]) => name)
  return found.length === 1 ? found[0] : null
}

/**
 * Installed versions against the tested range. A different major than the range
 * is an error (Setup reports the repo blocked). The same major outside the range
 * is a warning: flag it for the dev. A newer patch of the tested maximum's minor
 * (7.3.6 against 7.3.1) is a note: patch releases don't change what was tested.
 */
function checkTestedRange(repo, testedRange, err, framework, warn = err, notes = []) {
  const rangePath = testedRange ?? join(HERE, "tested-range.json")
  // A repo carries only ds-validate.mjs (since kit 0.8.0): the version check runs from the plugin.
  if (!existsSync(rangePath)) { err("tested-range.json", "isn't next to this ds-validate.mjs (a repo's copy has none: the version check runs from the plugin)", "run the plugin's: node <plugin>/kit/code/shadcn/scripts/ds-validate.mjs --repo . --preflight"); return }
  const range = JSON.parse(readFileSync(rangePath, "utf8"))
  let packages = range.packages
  if (range.frameworks) {
    const fw = framework ?? detectFramework(repo)
    if (!fw || !range.frameworks[fw]) {
      err("framework", fw ? `is "${fw}", which this kit has no tested range for` : "can't be told from the app's package.json",
        `this profile supports ${Object.keys(range.frameworks).join(" and ")} — the app's package.json must depend on exactly one of ${Object.values(FRAMEWORKS).join(", ")}`)
      return
    }
    packages = { ...range.packages, ...range.frameworks[fw] }
  }
  for (const [name, { min, max, required }] of Object.entries(packages)) {
    const v = installedVersion(repo, name)
    if (!v) {
      // Not a finding before the code step, which adds it at its tested max.
      if (required) notes.push(`package ${name} isn't installed yet — Setup's code step adds it at ${max}`)
      continue
    }
    if (compareVersions(v, min) >= 0 && compareVersions(v, max) <= 0) continue
    const [vMaj, vMin] = v.split(".").map(Number), [maxMaj, maxMin] = max.split(".").map(Number), [minMaj] = min.split(".").map(Number)
    if (vMaj !== minMaj && vMaj !== maxMaj)
      err(`package ${name}`, `is ${v}, a different major from the tested range ${min} – ${max}`, "Setup can't run on it: move it into the tested major, or widen the range with an acceptance run")
    else if (vMaj === maxMaj && vMin === maxMin && compareVersions(v, max) > 0)
      notes.push(`package ${name} is ${v}, a newer patch than the tested ${max} — not flagged`)
    else
      warn(`package ${name}`, `is ${v}, outside the tested range ${min} – ${max}`, "flag it for the dev; Setup never upgrades or downgrades an existing package")
  }
}

/**
 * The kit's own config template and token template (`--template`): every key
 * is checked as in a repo, except that a "{{…}}" placeholder stands for a value
 * Setup fills; `kitVersion` must equal these scripts' version; and there is no
 * repo, so the wiring and pre-flight checks don't apply.
 */
export function validateTemplate(configPath, tokensPath) {
  const errors = []
  const warnings = []
  const err = (field, message, fix) => errors.push({ field, message, fix })
  const warn = (field, message, fix) => warnings.push({ field, message, fix })
  let config
  try { config = JSON.parse(readFileSync(configPath, "utf8")) }
  catch (e) { err(configPath, `can't be read (${e.message})`, "fix the file"); return { errors, warnings } }
  checkConfig(config, err, { placeholders: true })
  if (config.kitVersion !== KIT_VERSION)
    err("kitVersion", `is ${config.kitVersion} in the config template; these scripts are ${KIT_VERSION}`, "bump the template with the scripts")
  const filled = [JSON.stringify(config).match(/\{\{[A-Z_]+\}\}/g) ?? []].flat()
  if (filled.length) warnings.push({ field: "placeholders", message: `${filled.length} left for Setup to fill`, fix: [...new Set(filled)].join(" ") })
  let tokens
  try { tokens = JSON.parse(readFileSync(tokensPath, "utf8")) }
  catch (e) { err(tokensPath, `can't be read (${e.message})`, "fix the file"); return { errors, warnings } }
  validateTokens(tokens, tokensPath, err, warn)
  return { errors, warnings }
}

// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2)
  const flag = (n) => { const i = args.indexOf(n); return i === -1 ? null : args[i + 1] }
  const repo = resolve(flag("--repo") ?? process.cwd())
  const { errors, warnings, notes } = args.includes("--template")
    ? validateTemplate(resolve(flag("--template")), resolve(flag("--tokens")))
    : validate(repo, { preflight: args.includes("--preflight"), testedRange: flag("--tested-range"), system: flag("--system") && resolve(flag("--system")), tokens: flag("--tokens") && resolve(flag("--tokens")) })
  for (const n of notes ?? []) console.log(`note     ${n}`)
  for (const w of warnings) console.log(`warning  ${w.field} ${w.message} — ${w.fix}`)
  for (const e of errors) console.log(`error    ${e.field} ${e.message} — ${e.fix}`)
  console.log(errors.length ? `\n${errors.length} error(s), ${warnings.length} warning(s)` : `valid (${warnings.length} warning(s)) — kit ${KIT_VERSION}`)
  process.exit(errors.length ? 1 : 0)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
