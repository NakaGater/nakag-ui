import { readFileSync } from "node:fs";

export interface Rule {
  id: string;
  category: string;
  severity: "error" | "warn";
  files: string[];
  type?: "missing-pattern";
  pattern?: string;
  flags?: string;
  ifPattern?: string;
  mustMatch?: string;
  whenFileMatches?: string;
  description: string;
  alternative: string;
}

export interface Finding {
  ruleId: string;
  severity: "error" | "warn";
  file: string;
  line: number;
  description: string;
  alternative: string;
}

// dist/cli/rules.js -> dist/ai/rules.json (and src/cli -> src/ai in dev).
export function loadRules(): Rule[] {
  const url = new URL("../ai/rules.json", import.meta.url);
  const data = JSON.parse(readFileSync(url, "utf8"));
  return data.rules as Rule[];
}

// Minimal glob: **, *, {a,b,c}. Enough for the patterns rules.json uses.
export function globToRegex(glob: string): RegExp {
  let re = "";
  let i = 0;
  while (i < glob.length) {
    const c = glob[i];
    if (c === "*") {
      if (glob[i + 1] === "*") {
        re += ".*";
        i += 2;
        if (glob[i] === "/") i++;
      } else {
        re += "[^/]*";
        i++;
      }
    } else if (c === "{") {
      const end = glob.indexOf("}", i);
      re += `(?:${glob
        .slice(i + 1, end)
        .split(",")
        .map((s) => s.trim())
        .join("|")})`;
      i = end + 1;
    } else {
      re += /[a-zA-Z0-9_/-]/.test(c) ? c : `\\${c}`;
      i++;
    }
  }
  return new RegExp(`(?:^|/)${re}$`);
}

export function ruleAppliesTo(rule: Rule, filePath: string): boolean {
  const normalized = filePath.replaceAll("\\", "/");
  return rule.files.some((glob) => globToRegex(glob).test(normalized));
}

function lineOfIndex(content: string, index: number): number {
  return content.slice(0, index).split("\n").length;
}

export function checkContent(
  filePath: string,
  content: string,
  rules: Rule[],
): Finding[] {
  const findings: Finding[] = [];
  for (const rule of rules) {
    if (!ruleAppliesTo(rule, filePath)) continue;

    if (
      rule.whenFileMatches &&
      !new RegExp(rule.whenFileMatches).test(content)
    ) {
      continue;
    }

    const push = (line: number) =>
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        file: filePath,
        line,
        description: rule.description,
        alternative: rule.alternative,
      });

    if (rule.type === "missing-pattern") {
      const ifMatch = new RegExp(rule.ifPattern as string).exec(content);
      if (ifMatch && !new RegExp(rule.mustMatch as string).test(content)) {
        push(lineOfIndex(content, ifMatch.index));
      }
      continue;
    }

    const flags = rule.flags ?? "";
    if (flags.includes("s")) {
      const re = new RegExp(rule.pattern as string, flags.replace("g", ""));
      const match = re.exec(content);
      if (match) push(lineOfIndex(content, match.index));
    } else {
      const re = new RegExp(rule.pattern as string, flags);
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (re.test(lines[i])) push(i + 1);
      }
    }
  }
  return findings;
}
