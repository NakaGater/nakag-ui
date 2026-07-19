---
name: nakag-ui
description: Use when writing or editing UI code (React components, screens, Tailwind styling) or HTML slide decks in this project. This project uses the @nakagater/ui design system and its rules must be followed.
---

# nakag-ui design system

このプロジェクトのUIは `@nakagater/ui` で統一されている。

## 手順

1. UI作業の前に必ず読む: `node_modules/@nakagater/ui/dist/llms.txt`(配線・コンポーネント表・禁止事項)
2. 正確な仕様が必要なとき(すべて `node_modules/@nakagater/ui/dist/` 配下):
   - variant/size/用例: `ai/components.json`
   - デザイントークン(light/dark実値): `ai/tokens.json`
   - スライドクラス: `ai/slides.json`
   - 全ルール(regex付き): `ai/rules.json`
3. importは必ずルートから: `import { Button, cn } from "@nakagater/ui"`
4. 色は必ずトークンユーティリティ(`bg-primary` 等)。hex・パレット色・任意値カラーは禁止
5. スライドは `<body class="deck">` + `<section class="slide">`。CDN URLはバージョン固定

## 検証

```bash
npx --no-install nakag-ui check <files...>
```

Write/Edit直後はhookが自動でこれを実行する。エラーが返ったら**必ず修正してから**タスクを完了すること。
