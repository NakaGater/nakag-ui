#!/usr/bin/env node
import { runCheck, runHook } from "./check";
import { runInit } from "./init";

const [, , command, ...args] = process.argv;

const HELP = `nakag-ui — @nakagater/ui AI tooling

Usage:
  nakag-ui init                このプロジェクトにAI設定を配置 (AGENTS.md / CLAUDE.md /
                               .claude/skills/nakag-ui / PostToolUse hook)
  nakag-ui check <files...>    デザインシステムルールで検査 (exit 1 = errorあり)
  nakag-ui check --hook        Claude Code PostToolUse hookモード (stdin JSON)
`;

async function main(): Promise<number> {
  switch (command) {
    case "init":
      return runInit();
    case "check":
      if (args[0] === "--hook") return await runHook();
      if (args.length === 0) {
        console.error("nakag-ui check: no files given\n");
        console.error(HELP);
        return 1;
      }
      return runCheck(args);
    default:
      console.log(HELP);
      return command ? 1 : 0;
  }
}

main().then((code) => {
  process.exitCode = code;
});
