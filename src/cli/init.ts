import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const BEGIN = "<!-- BEGIN nakag-ui -->";
const END = "<!-- END nakag-ui -->";

const HOOK_COMMAND = "npx --no-install nakag-ui check --hook";

type Status = "created" | "updated" | "unchanged" | "skipped";

function report(results: Array<[string, Status, string?]>): void {
  for (const [file, status, reason] of results) {
    const mark = { created: "+", updated: "~", unchanged: "=", skipped: "!" }[
      status
    ];
    console.log(`  ${mark} ${file}  ${status}${reason ? ` (${reason})` : ""}`);
  }
}

function template(name: string): string {
  return readFileSync(
    new URL(`../ai/templates/${name}`, import.meta.url),
    "utf8",
  );
}

function upsertMarkerBlock(existing: string | null, block: string): string {
  const wrapped = `${BEGIN}\n${block.trimEnd()}\n${END}`;
  if (existing === null) return `${wrapped}\n`;
  if (existing.includes(BEGIN) && existing.includes(END)) {
    const before = existing.slice(0, existing.indexOf(BEGIN));
    const after = existing.slice(existing.indexOf(END) + END.length);
    return `${before}${wrapped}${after}`;
  }
  return `${existing.trimEnd()}\n\n${wrapped}\n`;
}

function writeIfChanged(path: string, next: string): Status {
  const exists = existsSync(path);
  if (exists && readFileSync(path, "utf8") === next) return "unchanged";
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, next);
  return exists ? "updated" : "created";
}

interface HookGroup {
  matcher?: string;
  hooks?: Array<{ type: string; command?: string; timeout?: number }>;
}

function mergeHook(settingsPath: string): [Status, string?] {
  let settings: {
    hooks?: { PostToolUse?: HookGroup[]; [k: string]: unknown };
    [k: string]: unknown;
  } = {};
  if (existsSync(settingsPath)) {
    try {
      settings = JSON.parse(readFileSync(settingsPath, "utf8"));
    } catch {
      console.log(
        `\n.claude/settings.json をパースできませんでした。次のhookを手動で追加してください:\n` +
          `{"hooks":{"PostToolUse":[{"matcher":"Write|Edit","hooks":[{"type":"command","command":"${HOOK_COMMAND}","timeout":30}]}]}}`,
      );
      return ["skipped", "settings.jsonのパース失敗"];
    }
  }
  settings.hooks ??= {};
  settings.hooks.PostToolUse ??= [];
  const existing = settings.hooks.PostToolUse.flatMap(
    (g) => g.hooks ?? [],
  ).find((h) => h.command?.includes("nakag-ui check"));
  if (existing) {
    if (existing.command !== HOOK_COMMAND) {
      return [
        "skipped",
        `既存のnakag-ui hookが別コマンド: ${existing.command}`,
      ];
    }
    return ["unchanged"];
  }
  settings.hooks.PostToolUse.push({
    matcher: "Write|Edit",
    hooks: [{ type: "command", command: HOOK_COMMAND, timeout: 30 }],
  });
  const existed = existsSync(settingsPath);
  mkdirSync(dirname(settingsPath), { recursive: true });
  writeFileSync(settingsPath, `${JSON.stringify(settings, null, 2)}\n`);
  return [existed ? "updated" : "created"];
}

export function runInit(): number {
  const cwd = process.cwd();
  const results: Array<[string, Status, string?]> = [];

  // AGENTS.md — the single source of agent instructions.
  const agentsPath = join(cwd, "AGENTS.md");
  const agentsExisting = existsSync(agentsPath)
    ? readFileSync(agentsPath, "utf8")
    : null;
  const agentsNext = upsertMarkerBlock(
    agentsExisting,
    template("AGENTS-section.md"),
  );
  results.push(["AGENTS.md", writeIfChanged(agentsPath, agentsNext)]);

  // CLAUDE.md — just an @AGENTS.md import so content lives in one place.
  const claudePath = join(cwd, "CLAUDE.md");
  if (!existsSync(claudePath)) {
    writeFileSync(claudePath, `${BEGIN}\n@AGENTS.md\n${END}\n`);
    results.push(["CLAUDE.md", "created"]);
  } else if (readFileSync(claudePath, "utf8").includes("@AGENTS.md")) {
    results.push(["CLAUDE.md", "unchanged", "@AGENTS.md参照あり"]);
  } else {
    const existing = readFileSync(claudePath, "utf8");
    writeFileSync(
      claudePath,
      `${existing.trimEnd()}\n\n${BEGIN}\n@AGENTS.md\n${END}\n`,
    );
    results.push(["CLAUDE.md", "updated"]);
  }

  // Claude Code skill — ours to overwrite.
  const skillPath = join(cwd, ".claude/skills/nakag-ui/SKILL.md");
  results.push([
    ".claude/skills/nakag-ui/SKILL.md",
    writeIfChanged(skillPath, template("SKILL.md")),
  ]);

  // PostToolUse hook.
  const [hookStatus, hookReason] = mergeHook(
    join(cwd, ".claude/settings.json"),
  );
  results.push([".claude/settings.json", hookStatus, hookReason]);

  console.log("nakag-ui init:");
  report(results);
  console.log(
    "\n次の3行がglobals.cssにあることを確認してください:\n" +
      '  @import "tailwindcss";\n' +
      '  @import "@nakagater/ui/theme.css";\n' +
      '  @source "../node_modules/@nakagater/ui/dist";',
  );
  return 0;
}
