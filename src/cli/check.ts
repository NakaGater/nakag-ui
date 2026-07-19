import { existsSync, readFileSync } from "node:fs";
import { checkContent, type Finding, loadRules } from "./rules";

function formatFinding(f: Finding): string {
  return `${f.file}:${f.line} [${f.ruleId}/${f.severity}] ${f.description}\n  → ${f.alternative}`;
}

export function runCheck(files: string[]): number {
  const rules = loadRules();
  const findings: Finding[] = [];
  for (const file of files) {
    if (!existsSync(file)) {
      console.error(`nakag-ui check: file not found: ${file}`);
      return 1;
    }
    findings.push(...checkContent(file, readFileSync(file, "utf8"), rules));
  }
  for (const f of findings) {
    console.log(formatFinding(f));
  }
  const errors = findings.filter((f) => f.severity === "error").length;
  const warns = findings.length - errors;
  if (findings.length === 0) {
    console.log("✓ nakag-ui check: no violations");
  } else {
    console.log(`${errors} error(s), ${warns} warning(s)`);
  }
  return errors > 0 ? 1 : 0;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

// Claude Code PostToolUse hook protocol:
//   stdin: JSON with tool_input.file_path
//   exit 2 + stderr  -> fed back to Claude (self-correction loop)
//   exit 0 + stdout hookSpecificOutput.additionalContext -> non-blocking advice
//   anything infra-related (bad stdin, missing/out-of-scope file) -> exit 0, silent
export async function runHook(): Promise<number> {
  let filePath: string | undefined;
  try {
    const input = JSON.parse(await readStdin());
    filePath = input?.tool_input?.file_path;
  } catch {
    return 0;
  }
  if (!filePath || !existsSync(filePath)) return 0;

  let findings: Finding[];
  try {
    findings = checkContent(
      filePath,
      readFileSync(filePath, "utf8"),
      loadRules(),
    );
  } catch {
    return 0;
  }
  if (findings.length === 0) return 0;

  const errors = findings.filter((f) => f.severity === "error");
  if (errors.length > 0) {
    const body = findings.map(formatFinding).join("\n");
    console.error(
      `nakag-ui design system violations in ${filePath}:\n${body}\n上記のerrorを修正してください。仕様: node_modules/@nakagater/ui/dist/llms.txt`,
    );
    return 2;
  }

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: `nakag-ui check (warnings for ${filePath}):\n${findings
          .map(formatFinding)
          .join("\n")}`,
      },
    }),
  );
  return 0;
}
