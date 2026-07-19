# nakag-ui — デザイン憲法

個人開発プロダクト群とスライド資料の見た目を1つのトークンセットで統一するデザインシステム。shadcn/ui (new-york) をベースに、ビルド済みNPMパッケージ `@nakagater/ui` として配布する。

## 原則

1. **色はトークンのみ** — すべての色は `src/styles/tokens.css` のCSS変数(oklch)。hex直書き・Tailwindパレット色・任意値カラーは使わない。light/darkは `.dark` クラスで切替
2. **tokens.cssは純CSS** — `@theme`/`@apply` などTailwind構文を書かない(スライドCSSにそのまま同梱されるため。ビルドで機械検査される)
3. **Tailwind層は@theme inlineで包む** — `src/styles/theme.css` が唯一のマッピング箇所。`bg-background` が `var(--background)` を参照する形を崩さない
4. **クラス名は静的文字列のみ** — 利用側はdistをテキストスキャンするため、動的に組み立てたクラスはCSSが生成されない
5. **shadcnの流儀に従う** — コンポーネントはshadcn CLIで追加し、独自改変は最小限。variantの追加はcva定義に閉じる
6. **スライドはアプリと同じトークン** — `src/slides/slide.css` はフレームワーク非依存・依存ゼロの単一ファイルとして出荷。本文1em基準・16:9固定・印刷=PDF資料
7. **AIにも読める** — 仕様はビルド時に `dist/ai/*.json` + `dist/llms.txt` に機械可読化される。手書きSSOTは `src/ai/`(rules/meta)。宣言と実体のずれはビルドが落として検知する

## クイックリファレンス

- 利用側配線(3行必須): `@import "tailwindcss"` / `@import "@nakagater/ui/theme.css"` / `@source "../node_modules/@nakagater/ui/dist"`
- コンポーネント16種: badge, button, card, checkbox, dialog, dropdown-menu, input, label, select, separator, skeleton, sonner, switch, tabs, textarea, tooltip (+`cn`)
- トークン: shadcn命名(--background, --primary, --muted-foreground, --radius, --font-sans, --shadow-* …)。実値は `dist/ai/tokens.json`
- 禁止ルール12件: `src/ai/rules.json`(NU0xx=アプリ, NS0xx=スライド)
- プレビュー: https://nakagater.github.io/nakag-ui/ (Storybook) / /slides/template.html
