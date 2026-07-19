## nakag-ui design system

このプロジェクトは `@nakagater/ui` デザインシステムを使用する。UI(Reactコンポーネント・画面・Tailwindスタイリング)やHTMLスライドを書く際は以下に従うこと。

1. **作業前に読む**: `node_modules/@nakagater/ui/dist/llms.txt`(配線・コンポーネント表・トークン・禁止事項の要約)
2. **正確な仕様**が必要なとき:
   - variant/size/用例: `node_modules/@nakagater/ui/dist/ai/components.json`
   - デザイントークン(light/dark実値): `node_modules/@nakagater/ui/dist/ai/tokens.json`
   - スライドクラス: `node_modules/@nakagater/ui/dist/ai/slides.json`
   - 全ルール(regex付き): `node_modules/@nakagater/ui/dist/ai/rules.json`
3. **import はルートから**: `import { Button, cn } from "@nakagater/ui"`(dist/へのdeep import禁止)
4. **色は必ずトークン**(`bg-primary`, `text-muted-foreground` 等)。hex直書き・任意値カラー・Tailwindパレット色は禁止
5. **CSS配線**: globals.cssには `@import "tailwindcss"` / `@import "@nakagater/ui/theme.css"` / `@source "../node_modules/@nakagater/ui/dist"` の3行が必要(@source欠落=スタイル全滅)
6. **検証**: UI/スライドのファイルを書いたら `npx --no-install nakag-ui check <files...>` を実行し、errorをすべて修正してから完了とすること(Claude Codeではhookが自動実行する)
