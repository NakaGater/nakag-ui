import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const dist = join(root, "dist");

const tokens = readFileSync(join(src, "styles/tokens.css"), "utf8");

const forbidden = /@theme|@apply|@custom-variant|@import\s+["']tailwindcss/;
for (const file of ["styles/tokens.css", "slides/slide.css"]) {
  const css = readFileSync(join(src, file), "utf8").replace(
    /\/\*[\s\S]*?\*\//g,
    "",
  );
  if (forbidden.test(css)) {
    console.error(`✖ ${file} must stay vanilla CSS (found Tailwind syntax)`);
    process.exit(1);
  }
}

mkdirSync(join(dist, "slides"), { recursive: true });

// tokens.css + theme.css land side by side in dist root, so the
// `@import "./tokens.css"` inside theme.css keeps resolving.
copyFileSync(join(src, "styles/tokens.css"), join(dist, "tokens.css"));
copyFileSync(join(src, "styles/theme.css"), join(dist, "theme.css"));

// Standalone slide stylesheet: tokens inlined, zero imports, zero Tailwind.
const slide = readFileSync(join(src, "slides/slide.css"), "utf8");
writeFileSync(
  join(dist, "slides/slide.css"),
  `${tokens}\n${slide.replace('@import "../styles/tokens.css";\n', "")}`,
);
copyFileSync(
  join(src, "slides/template.html"),
  join(dist, "slides/template.html"),
);

console.log("✓ CSS assets written to dist/");
