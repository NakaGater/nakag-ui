import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cli = join(root, "dist/cli/index.js");
let failures = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    console.error(`  ✖ ${msg}`);
    failures++;
  }
}

function runCheck(files) {
  const res = spawnSync("node", [cli, "check", ...files], {
    cwd: root,
    encoding: "utf8",
  });
  const ids = [
    ...new Set([...res.stdout.matchAll(/\[(N[US]\d+)\//g)].map((m) => m[1])),
  ];
  return { code: res.status, ids: ids.sort(), out: res.stdout };
}

function runHook(filePath) {
  const input = JSON.stringify({
    hook_event_name: "PostToolUse",
    tool_name: "Write",
    tool_input: { file_path: filePath },
  });
  return spawnSync("node", [cli, "check", "--hook"], {
    cwd: root,
    input,
    encoding: "utf8",
  });
}

console.log("check: violation fixtures detect expected rules");
const expected = {
  "fixtures/violations/bad-colors.tsx": {
    ids: ["NU001", "NU002", "NU003"],
    code: 1,
  },
  "fixtures/violations/bad-import.tsx": { ids: ["NU010", "NU030"], code: 1 },
  "fixtures/violations/bad-a11y.tsx": {
    ids: ["NU040", "NU050", "NU060"],
    code: 1,
  },
  "fixtures/violations/bad-globals.css": { ids: ["NU020"], code: 1 },
  "fixtures/violations/bad-deck.html": {
    ids: ["NS001", "NS002", "NS003"],
    code: 1,
  },
  "fixtures/violations/warn-only.tsx": { ids: ["NU050"], code: 0 },
};
for (const [file, want] of Object.entries(expected)) {
  const { code, ids } = runCheck([file]);
  assert(
    JSON.stringify(ids) === JSON.stringify(want.ids) && code === want.code,
    `${file} → ${want.ids.join(",")} (exit ${want.code}); got ${ids.join(",") || "none"} (exit ${code})`,
  );
}

console.log("check: clean fixtures produce zero findings");
for (const f of readdirSync(join(root, "fixtures/clean"))) {
  const { code, ids } = runCheck([`fixtures/clean/${f}`]);
  assert(ids.length === 0 && code === 0, `fixtures/clean/${f} clean (exit 0)`);
}

console.log("hook: PostToolUse protocol");
{
  const res = runHook(join(root, "fixtures/violations/bad-colors.tsx"));
  assert(
    res.status === 2 && res.stderr.includes("NU001"),
    `error file → exit 2 + rule id on stderr (got ${res.status})`,
  );
}
{
  const res = runHook(join(root, "fixtures/clean/good.tsx"));
  assert(
    res.status === 0 && res.stdout.trim() === "" && res.stderr.trim() === "",
    "clean file → exit 0, silent",
  );
}
{
  const res = runHook(join(root, "fixtures/violations/warn-only.tsx"));
  let ctx = null;
  try {
    ctx = JSON.parse(res.stdout).hookSpecificOutput;
  } catch {}
  assert(
    res.status === 0 &&
      ctx?.hookEventName === "PostToolUse" &&
      ctx.additionalContext.includes("NU050"),
    "warn-only file → exit 0 + additionalContext JSON",
  );
}
{
  const res = spawnSync("node", [cli, "check", "--hook"], {
    input: "not json",
    encoding: "utf8",
  });
  assert(res.status === 0, "garbage stdin → exit 0 (non-blocking)");
}

console.log("manifests: generated content sanity");
{
  const components = JSON.parse(
    readFileSync(join(root, "dist/ai/components.json"), "utf8"),
  ).components;
  assert(
    components.length === 16,
    `components.json has 16 components (got ${components.length})`,
  );
  const button = components.find((c) => c.id === "button");
  assert(
    button.variants.variant.options.includes("destructive") &&
      button.variants.size.options.includes("icon"),
    "button variants include destructive + icon",
  );
  const tokens = JSON.parse(
    readFileSync(join(root, "dist/ai/tokens.json"), "utf8"),
  ).tokens;
  const primary = tokens.find((t) => t.name === "primary");
  assert(
    primary.light !== primary.dark,
    "tokens.json primary has distinct light/dark",
  );
  const llms = readFileSync(join(root, "dist/llms.txt"), "utf8");
  assert(!llms.includes("{{"), "llms.txt has no unresolved placeholders");
  const pkgVersion = JSON.parse(
    readFileSync(join(root, "package.json"), "utf8"),
  ).version;
  assert(
    llms.includes(`@nakagater/ui@${pkgVersion}`),
    "llms.txt pins current version in CDN URL",
  );
}

console.log("cli: no client-code bleed");
{
  const offenders = readdirSync(join(root, "dist/cli"))
    .filter((f) => f.endsWith(".js"))
    .filter((f) =>
      /from\s*"(?:react|radix-ui|lucide-react)/.test(
        readFileSync(join(root, "dist/cli", f), "utf8"),
      ),
    );
  assert(
    offenders.length === 0,
    `dist/cli imports no react/radix (offenders: ${offenders.join(",") || "none"})`,
  );
  const first = readFileSync(join(root, "dist/cli/index.js"), "utf8").split(
    "\n",
  )[0];
  assert(first.startsWith("#!"), "dist/cli/index.js has shebang");
}

if (failures > 0) {
  console.error(`\n✖ ${failures} test(s) failed`);
  process.exit(1);
}
console.log("\n✓ all CLI tests passed");
