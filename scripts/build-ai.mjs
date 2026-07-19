import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const distAi = join(root, "dist/ai");

const fail = (msg) => {
  console.error(`✖ build-ai: ${msg}`);
  process.exit(1);
};

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

// ---------- components.json ----------

// String-aware scanner: extracts the object-literal second argument of cva().
// shadcn cva configs are pure data (string literals only), so Function-eval
// of the extracted text is exact. Any parse miss must fail the build.
function extractCvaConfigs(source, file) {
  const configs = [];
  let idx = 0;
  while (true) {
    const at = source.indexOf("cva(", idx);
    if (at === -1) break;
    let i = at + 4;
    let paren = 1;
    let brace = 0;
    let quote = null;
    let configStart = -1;
    for (; i < source.length; i++) {
      const c = source[i];
      const prev = source[i - 1];
      if (quote) {
        if (c === quote && prev !== "\\") quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === "`") {
        quote = c;
        continue;
      }
      if (c === "(") paren++;
      else if (c === ")") {
        paren--;
        if (paren === 0) break;
      } else if (c === "{") {
        if (paren === 1 && brace === 0 && configStart === -1) configStart = i;
        brace++;
      } else if (c === "}") brace--;
    }
    if (paren !== 0 || configStart === -1) {
      fail(`${file}: cva() call could not be parsed (unbalanced delimiters)`);
    }
    const configEnd = source.lastIndexOf("}", i);
    const text = source.slice(configStart, configEnd + 1);
    let obj;
    try {
      obj = new Function(`return (${text})`)();
    } catch (e) {
      fail(`${file}: cva() config is not a pure data literal: ${e.message}`);
    }
    configs.push(obj);
    idx = i;
  }
  return configs;
}

function buildComponents() {
  const meta = JSON.parse(
    readFileSync(join(src, "ai/components.meta.json"), "utf8"),
  );
  const dir = join(src, "components/ui");
  const files = readdirSync(dir).filter(
    (f) => f.endsWith(".tsx") && !f.endsWith(".stories.tsx"),
  );
  const components = [];
  for (const file of files) {
    const id = basename(file, ".tsx");
    const source = readFileSync(join(dir, file), "utf8");
    if (!meta[id]) {
      fail(`components.meta.json has no entry for "${id}" — add one`);
    }
    const exportsMatch = [...source.matchAll(/export\s*\{([^}]+)\}/g)]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    if (exportsMatch.length === 0) fail(`${file}: no named exports found`);

    const radix = [
      ...source.matchAll(/import\s*\{([^}]+)\}\s*from\s*"radix-ui"/g),
    ]
      .flatMap((m) => m[1].split(","))
      .map((s) => s.trim().replace(/^type\s+/, ""))
      .filter(Boolean);

    const variants = {};
    if (source.includes("cva(")) {
      const configs = extractCvaConfigs(source, file);
      if (configs.length === 0) fail(`${file}: contains cva( but none parsed`);
      for (const cfg of configs) {
        for (const [key, options] of Object.entries(cfg.variants ?? {})) {
          variants[key] = {
            options: Object.keys(options),
            default: cfg.defaultVariants?.[key] ?? null,
          };
        }
      }
    }

    components.push({
      id,
      exports: exportsMatch,
      client: source.trimStart().startsWith('"use client"'),
      radix,
      variants,
      description: meta[id].description,
      usage: meta[id].usage,
      ...(meta[id].notes ? { notes: meta[id].notes } : {}),
    });
  }

  for (const key of Object.keys(meta)) {
    if (!components.some((c) => c.id === key)) {
      fail(`components.meta.json has orphan entry "${key}"`);
    }
  }

  // index.ts coverage: every component module must be re-exported.
  const index = readFileSync(join(src, "index.ts"), "utf8");
  const reExported = [
    ...index.matchAll(/from\s*"\.\/components\/ui\/([\w-]+)"/g),
  ].map((m) => m[1]);
  for (const c of components) {
    if (!reExported.includes(c.id)) {
      fail(`src/index.ts does not re-export "${c.id}"`);
    }
  }
  for (const id of reExported) {
    if (!components.some((c) => c.id === id)) {
      fail(`src/index.ts re-exports unknown module "${id}"`);
    }
  }
  if (!/export\s*\{\s*cn\s*\}/.test(index)) fail("src/index.ts must export cn");

  return components;
}

// ---------- tokens.json ----------

function extractBlock(css, selector) {
  const at = css.indexOf(selector);
  if (at === -1) fail(`tokens.css: selector "${selector}" not found`);
  const open = css.indexOf("{", at);
  let depth = 1;
  let i = open + 1;
  for (; i < css.length && depth > 0; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") depth--;
  }
  return css.slice(open + 1, i - 1);
}

function categoryOf(name) {
  if (name.startsWith("chart-")) return "chart";
  if (name.startsWith("font-")) return "font";
  if (name.startsWith("shadow-")) return "shadow";
  if (name === "radius") return "radius";
  return "color";
}

function buildTokens() {
  const css = readFileSync(join(src, "styles/tokens.css"), "utf8");
  const varsOf = (block) =>
    Object.fromEntries(
      [...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [
        m[1],
        m[2].replace(/\s+/g, " ").trim(),
      ]),
    );
  const light = varsOf(extractBlock(css, ":root"));
  const dark = varsOf(extractBlock(css, ".dark"));
  const darkOptional = new Set(["radius", "font-sans", "font-mono"]);
  const tokens = Object.entries(light).map(([name, value]) => {
    if (!dark[name] && !darkOptional.has(name)) {
      fail(`tokens.css: "--${name}" has no .dark counterpart`);
    }
    return {
      name,
      category: categoryOf(name),
      light: value,
      dark: dark[name] ?? value,
    };
  });
  if (tokens.length < 20) fail("tokens.css: suspiciously few tokens parsed");
  return tokens;
}

// ---------- slides.json ----------

function buildSlides() {
  const meta = JSON.parse(
    readFileSync(join(src, "ai/slides.meta.json"), "utf8"),
  );
  const css = readFileSync(join(src, "slides/slide.css"), "utf8");
  const found = new Set(
    [...css.matchAll(/(?:^|\n)\s*\.([a-z][\w-]*)/g)].map((m) => m[1]),
  );
  for (const cls of found) {
    if (!meta[cls]) fail(`slides.meta.json has no entry for ".${cls}"`);
  }
  for (const cls of Object.keys(meta)) {
    if (!found.has(cls)) {
      fail(`slides.meta.json entry ".${cls}" not found in slide.css`);
    }
  }
  return Object.entries(meta).map(([className, purpose]) => ({
    class: className,
    purpose,
  }));
}

// ---------- rules.json ----------

function buildRules() {
  const data = JSON.parse(readFileSync(join(src, "ai/rules.json"), "utf8"));
  const ids = new Set();
  for (const rule of data.rules) {
    if (ids.has(rule.id)) fail(`rules.json: duplicate id ${rule.id}`);
    ids.add(rule.id);
    if (!["error", "warn"].includes(rule.severity)) {
      fail(`rules.json ${rule.id}: bad severity "${rule.severity}"`);
    }
    for (const key of [
      "pattern",
      "ifPattern",
      "mustMatch",
      "whenFileMatches",
    ]) {
      if (rule[key]) {
        try {
          new RegExp(rule[key], rule.flags ?? "");
        } catch (e) {
          fail(`rules.json ${rule.id}.${key}: invalid regex — ${e.message}`);
        }
      }
    }
    if (rule.type === "missing-pattern") {
      if (!rule.ifPattern || !rule.mustMatch) {
        fail(
          `rules.json ${rule.id}: missing-pattern needs ifPattern + mustMatch`,
        );
      }
    } else if (!rule.pattern) {
      fail(`rules.json ${rule.id}: needs a pattern`);
    }
  }
  return data;
}

// ---------- llms.txt ----------

function renderLlms(components, tokens, slides, rules) {
  const template = readFileSync(join(src, "ai/llms.template.txt"), "utf8");

  const componentsTable = [
    "| Component | Exports | Variants | Note |",
    "|---|---|---|---|",
    ...components.map((c) => {
      const variantCol =
        Object.entries(c.variants)
          .map(([k, v]) => `${k}: ${v.options.join("/")}`)
          .join("; ") || "-";
      return `| ${c.id} | ${c.exports.join(", ")} | ${variantCol} | ${c.description} |`;
    }),
  ].join("\n");

  const tokenNames = tokens.map((t) => `--${t.name}`).join(", ");

  const slidesTable = slides
    .map((s) => `- \`.${s.class}\` — ${s.purpose}`)
    .join("\n");

  const rulesSummary = rules.rules
    .map((r) => `- ${r.id} (${r.severity}): ${r.description}`)
    .join("\n");

  const out = template
    .replaceAll("{{VERSION}}", pkg.version)
    .replace("{{COMPONENTS_TABLE}}", componentsTable)
    .replace("{{TOKEN_NAMES}}", tokenNames)
    .replace("{{SLIDES_TABLE}}", slidesTable)
    .replace("{{RULES_SUMMARY}}", rulesSummary);

  if (out.includes("{{")) fail("llms.txt: unresolved {{placeholder}} remains");
  if (out.length > 16 * 1024) {
    fail(
      `llms.txt too large (${out.length} bytes) — keep it a compact entry doc`,
    );
  }
  return out;
}

// ---------- main ----------

const components = buildComponents();
const tokens = buildTokens();
const slides = buildSlides();
const rules = buildRules();

mkdirSync(distAi, { recursive: true });
const write = (name, data) =>
  writeFileSync(join(distAi, name), `${JSON.stringify(data, null, 2)}\n`);
write("components.json", { version: pkg.version, components });
write("tokens.json", { version: pkg.version, tokens });
write("slides.json", { version: pkg.version, classes: slides });
write("rules.json", { version: pkg.version, ...rules });
writeFileSync(
  join(root, "dist/llms.txt"),
  renderLlms(components, tokens, slides, rules),
);
cpSync(join(src, "ai/templates"), join(distAi, "templates"), {
  recursive: true,
});

// CLI shebang + exec bit (entry added by tsdown; enforce here so a bundler
// upgrade can't silently drop it).
const cliEntry = join(root, "dist/cli/index.js");
if (existsSync(cliEntry)) {
  const js = readFileSync(cliEntry, "utf8");
  if (!js.startsWith("#!")) {
    writeFileSync(cliEntry, `#!/usr/bin/env node\n${js}`);
  }
  chmodSync(cliEntry, 0o755);
}

console.log(
  `✓ AI assets written: ${components.length} components, ${tokens.length} tokens, ${slides.length} slide classes, ${rules.rules.length} rules`,
);
