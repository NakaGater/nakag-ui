# nakag-ui 保守ガイド (Claude Code用)

デザイン原則と全体像は @DESIGN.md を先に読むこと。

## コマンド

```bash
pnpm storybook        # 開発ループ (ダークトグル付きカタログ)
pnpm build            # tsdown + CSS + AI manifest生成 (dist/)
pnpm test:cli         # ルール検出器 + hookプロトコルのテスト
pnpm lint / lint:fix / typecheck
pnpm check:pkg        # publint + attw (exports検証)
```

## コンポーネント追加手順

1. `pnpm dlx shadcn@latest add <name>`(components.jsonは`rsc: true`設定 — "use client"を保持する)
2. `src/index.ts` に `export * from "./components/ui/<name>"` を追加
3. `src/ai/components.meta.json` に説明(ja)とusageを追加 — **書かないと `pnpm build` が失敗する**(意図した設計)
4. `src/components/ui/<name>.stories.tsx` を作成
5. shadcn CLIがCSS変数をglobals.cssに書き込んだ場合は `src/styles/tokens.css`(+theme.cssのマッピング)へ移動
6. `pnpm build && pnpm test:cli` で検証

## AI層の構造 (melta-ui適応)

- 手書きSSOT: `src/ai/rules.json`(12ルール) / `components.meta.json` / `slides.meta.json` / `llms.template.txt` / `templates/`(利用側init雛形)
- 生成物(コミットしない): `dist/ai/*.json` + `dist/llms.txt` ← `scripts/build-ai.mjs` がcva/tokens.css/slide.cssから抽出。抽出失敗・meta欠落・未マップクラスはビルドエラー
- CLI: `src/cli/`(依存ゼロ)。`nakag-ui init`=利用側スキャフォールド、`nakag-ui check`=ルール検査、`check --hook`=Claude Code PostToolUse(error→exit 2でstderrフィードバック)
- **ルールを変えたら** `fixtures/` と `scripts/test-cli.mjs` の期待値も更新すること

## リリース

```bash
npm version minor && git push --follow-tags   # タグpushでCIがnpm publish (OIDC)
```

スライドCDN URLはllms.txt内でバージョン固定生成されるため、リリース後のjsdelivr疎通は自動的に新バージョンを指す。
