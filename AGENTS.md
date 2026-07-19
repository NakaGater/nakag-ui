# nakag-ui — AIエージェント向け入口

このリポジトリは `@nakagater/ui` デザインシステム本体。

- デザイン原則・クイックリファレンス: `DESIGN.md`
- 保守手順(コマンド・コンポーネント追加・リリース): `CLAUDE.md`
- 機械可読仕様(ビルド後): `dist/ai/{components,tokens,slides,rules}.json` / `dist/llms.txt`
- 利用側プロジェクトのセットアップ: `npx @nakagater/ui init`(このリポジトリでは実行しない)

UIコード・スライドCSS・トークンを変更したら `pnpm build && pnpm test:cli && pnpm lint && pnpm typecheck` を通すこと。
