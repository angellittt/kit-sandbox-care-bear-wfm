import reactEslintConfig from "@repo/eslint-config/eslint.react.config";
import { disableRulesCoveredByOxlint } from "@repo/eslint-config/oxlint";
import { defineConfig } from "eslint/config";

// design-system-kit 0.28.21 · profile shadcn · wiring (Vite): ESLint, for a TypeScript config
import type { ESLint, Linter, Rule } from "eslint";
import { builtinRules } from "eslint/use-at-your-own-risk";

// ---- design-system-kit (vendored files keep stock shadcn's style) ----------
// Files the kit vendors: stock components, kept as shadcn ships them, and the
// two stock helpers outside the component folder. App-owned files the kit only
// seeds (src/lib/locale.ts) aren't here — the app's style applies to them.
const DS_VENDORED = [
  "src/components/ui/**",
  "src/components/theme-provider.tsx",
  "src/hooks/use-mobile.ts",
];
// Rules from these plugins stay on everywhere: accessibility and hooks.
const DS_ALWAYS_ON = new Set(["jsx-a11y", "react-hooks"]);

// The repo's style rules — those ESLint itself types "layout" or "suggestion"
// (prefer-arrow-functions, import-x/order) — off for the vendored files only.
// Correctness ("problem") rules stay on. Only rules the repo turns on are named.
// (Maps rather than object lookups, so a repo's security rules don't flag it.)
type DsRule = { meta?: { type?: string } };
const dsStyleRulesOff = (entries: Linter.Config[]): Linter.Config => {
  const plugins = new Map<string, Map<string, DsRule>>();
  for (const e of entries) {
    for (const [name, plugin] of Object.entries(e.plugins ?? {})) {
      plugins.set(
        name,
        new Map(
          Object.entries(
            (plugin as { rules?: Record<string, DsRule> }).rules ?? {},
          ),
        ),
      );
    }
  }
  const on = new Set<string>();
  for (const e of entries) {
    for (const [id, setting] of Object.entries(e.rules ?? {})) {
      const level = Array.isArray(setting) ? setting[0] : setting;
      if (level === "off" || level === 0) on.delete(id);
      else on.add(id);
    }
  }
  const style = [...on].filter((id) => {
    const slash = id.lastIndexOf("/");
    const plugin = slash === -1 ? null : id.slice(0, slash);
    if (plugin && DS_ALWAYS_ON.has(plugin)) return false;
    const type = plugin
      ? plugins.get(plugin)?.get(id.slice(slash + 1))?.meta?.type
      : builtinRules.get(id)?.meta?.type;
    return type === "layout" || type === "suggestion";
  });
  return {
    files: DS_VENDORED,
    rules: Object.fromEntries(style.map((id) => [id, "off"])),
  };
};

// ---- design-system-kit: tokens only -----------------------------------------
// App code styles with the design system's tokens: the Tailwind names in its
// "Using in code". A raw colour (`bg-[#1a2b3c]`, `text-[oklch(…)]`, a "#fff"
// string) is an error, and so is a default palette class (`bg-zinc-500`), which
// the token file turns off; an arbitrary size or space (`p-[18px]`, `text-[13px]`,
// `rounded-[10px]`) is a warning, since layout sometimes needs one. A value the
// tokens keep missing is a token request to design, not an override. An
// exception is an eslint-disable comment that says why. Vendored components
// keep stock's own fixed sizes, so they're left out.
const DS_COLOUR_FN = /^(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\(/i;
// A whole string that is one colour ("#fff", "rgb(0 0 0)"). Simple patterns and a
// scan rather than one nested regex, so a repo's security rules (detect-unsafe-regex)
// don't flag the block.
const DS_HEX = /^#[0-9a-f]{3,8}$/i;
const DS_COLOUR_LITERAL_FN = /^(?:rgba?|hsla?|oklch|oklab|lab|lch)\(/i;
const dsIsColourLiteral = (text: string): boolean => {
  const t = text.trim();
  return (
    DS_HEX.test(t) ||
    (DS_COLOUR_LITERAL_FN.test(t) && t.indexOf(")") === t.length - 1)
  );
};
const DS_SIZED = new Set(
  "p px py pt pr pb pl ps pe m mx my mt mr mb ml ms me gap gap-x gap-y space-x space-y w h size min-w min-h max-w max-h inset inset-x inset-y top right bottom left rounded text leading tracking translate-x translate-y".split(
    " ",
  ),
);
/** A utility that sets a size or a space: `p`, `-mt`, `rounded-tl`, `text`. */
const dsIsSized = (utility: string): boolean => {
  const u = utility.startsWith("-") ? utility.slice(1) : utility;
  return DS_SIZED.has(u) || /^rounded-[a-z]+$/.test(u);
};

/** The arbitrary value of each utility in a class string: `hover:p-[18px]` → ["p", "18px"]. */
const dsArbitrary = (text: string): [string, string, string][] =>
  text.split(/\s+/).flatMap((cls) => {
    // The utility starts after the last variant colon outside brackets (`[&:hover]:` is one variant).
    let depth = 0;
    let start = 0;
    for (let i = 0; i < cls.length; i++) {
      const ch = cls.charAt(i);
      if (ch === "[") depth++;
      else if (ch === "]") depth--;
      else if (ch === ":" && depth === 0) start = i + 1;
    }
    const m = /^!?(-?[a-z][\w-]*?)-\[([^\]]+)\]!?$/.exec(cls.slice(start));
    return m ? [[cls, m[1], m[2]] as [string, string, string]] : [];
  });

// Tailwind's default palette (`bg-zinc-500`, `hover:text-red-600/80`): the token
// file turns it off, so such a class styles nothing. Black and white stay on.
const DS_PALETTE_HUES = new Set(
  "slate gray zinc neutral stone red orange amber yellow lime green emerald teal cyan sky blue indigo violet purple fuchsia pink rose".split(
    " ",
  ),
);
const DS_PALETTE_UTILITIES = new Set(
  "bg text border border-t border-r border-b border-l border-x border-y border-s border-e ring ring-offset outline fill stroke from via to divide decoration placeholder caret accent shadow inset-shadow drop-shadow".split(
    " ",
  ),
);
const DS_PALETTE_STEP = /^(?:50|[1-9]00|950)$/;
/** The default-palette classes in a class string: `hover:bg-zinc-500/50`. */
const dsPalette = (text: string) =>
  text.split(/\s+/).filter((cls) => {
    const parts = cls
      .slice(cls.lastIndexOf(":") + 1)
      .replace(/^!|!$/g, "")
      .replace(/\/\d+$/, "")
      .split("-");
    const step = parts.pop() ?? "";
    const hue = parts.pop() ?? "";
    return (
      DS_PALETTE_STEP.test(step) &&
      DS_PALETTE_HUES.has(hue) &&
      DS_PALETTE_UTILITIES.has(parts.join("-"))
    );
  });

const dsStringRule = (
  meta: Rule.RuleMetaData,
  check: (text: string) => string[],
): Rule.RuleModule => ({
  meta: { ...meta, schema: [] },
  create: (context) => {
    const visit = (node: Rule.Node, text: string) => {
      for (const message of check(text)) context.report({ node, message });
    };
    return {
      Literal: (node) => {
        if (typeof node.value === "string") visit(node, node.value);
      },
      TemplateElement: (node) =>
        visit(node, node.value.cooked ?? node.value.raw),
    };
  },
});

const dsTokensPlugin: ESLint.Plugin = {
  rules: {
    "no-raw-colour": dsStringRule(
      {
        type: "problem",
        docs: { description: "Colours come from the design system's tokens" },
      },
      (text) => [
        ...dsArbitrary(text)
          .filter(
            ([, , value]) => value.startsWith("#") || DS_COLOUR_FN.test(value),
          )
          .map(
            ([cls]) =>
              `\`${cls}\` is a raw colour: use a token's Tailwind name ("Using in code"). A colour the tokens don't have is a token request to design.`,
          ),
        ...dsPalette(text).map(
          (cls) =>
            `\`${cls}\` is Tailwind's default palette, which the token file turns off: use a token's Tailwind name ("Using in code").`,
        ),
        ...(dsIsColourLiteral(text)
          ? [
              `"${text.trim()}" is a raw colour: use a token (var(--<token>) or its Tailwind name). A colour the tokens don't have is a token request to design.`,
            ]
          : []),
      ],
    ),
    "no-arbitrary-size": dsStringRule(
      {
        type: "suggestion",
        docs: { description: "Sizes and spaces come from the scale" },
      },
      (text) =>
        dsArbitrary(text)
          .filter(
            ([, utility, value]) =>
              dsIsSized(utility) &&
              /\d/.test(value) &&
              !value.startsWith("#") &&
              !DS_COLOUR_FN.test(value) &&
              !value.includes("var("),
          )
          .map(
            ([cls]) =>
              `\`${cls}\` is an arbitrary size: use the spacing scale, a radius or a type class. If designs keep needing it, ask design for a token.`,
          ),
    ),
  },
};

/** Every app file but the vendored components and tests. */
const tokensOnly: Linter.Config = {
  files: ["**/*.{js,jsx,mjs,ts,tsx}"],
  ignores: [
    "**/components/ui/**",
    "**/hooks/use-mobile.ts",
    "**/components/theme-provider.tsx",
    "**/*.{test,spec,stories}.{js,jsx,ts,tsx}",
    "scripts/**",
  ],
  plugins: { "design-system": dsTokensPlugin },
  rules: {
    "design-system/no-raw-colour": "error",
    "design-system/no-arbitrary-size": "warn",
  },
};
// ---- end tokens only ----------------------------------------------------------

const withDesignSystem = (entries: Linter.Config[]): Linter.Config[] => [
  ...entries,
  tokensOnly,
  // Vendored components carry disable comments for other configs' rules
  // (react-hooks/exhaustive-deps); a repo that doesn't enable them would report
  // the comments as unused.
  {
    files: ["src/components/ui/**"],
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
  dsStyleRulesOff(entries),
  // The kit files a repo carries for its CI check are linted in the kit.
  { ignores: ["scripts/ds-validate.mjs", "scripts/ds-drift.test.mjs"] },
];
// ---- end design-system-kit -------------------------------------------------

export default defineConfig(
  withDesignSystem([
    ...reactEslintConfig,
    {
      rules: {
        "import-x/no-unresolved": [
          "error",
          {
            /* Ignoring absolute import paths because we couldn't figure out how to make it work with eslint
             * Created a ticket for this: https://app.clickup.com/t/8593845/HAND_INT-552
             */
            ignore: ["^@/"],
          },
        ],
      },
    },
    ...disableRulesCoveredByOxlint(`${import.meta.dirname}/.oxlintrc.json`),
  ]),
);
