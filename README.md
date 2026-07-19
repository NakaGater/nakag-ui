# @nakagater/ui

shadcn/ui ベースの個人用デザインシステム。ビルド済み React コンポーネント (Tailwind v4 前提) と、同じデザイントークンを使うフレームワーク非依存のスライド CSS を配布します。

**プレビュー**: [コンポーネントカタログ (Storybook)](https://nakagater.github.io/nakag-ui/) / [スライドテンプレート](https://nakagater.github.io/nakag-ui/slides/template.html)

## インストール (アプリ)

```bash
npm install @nakagater/ui
```

利用側の `globals.css` (Next.js) / `index.css` (Vite) に **3行** 追加します:

```css
@import "tailwindcss";
@import "@nakagater/ui/theme.css";
@source "../node_modules/@nakagater/ui/dist";
```

> **`@source` は必須です。** Tailwind v4 は `node_modules` をスキャンしないため、
> この行がないとコンポーネント内のユーティリティクラスの CSS が一切生成されません
> (パスは CSS ファイルからの相対パス)。

peerDependencies: `react ^19` / `react-dom ^19` / `tailwindcss ^4.1`

```tsx
import { Button, Card, CardContent, cn } from "@nakagater/ui";
```

ダークモードは `<html class="dark">` で切り替え (next-themes は `attribute="class"`)。

### 収録コンポーネント

badge / button / card / checkbox / dialog / dropdown-menu / input / label /
select / separator / skeleton / sonner (Toaster) / switch / tabs / textarea /
tooltip + `cn()`

## スライド (純 HTML/CSS)

React もビルドも不要。`dist/slides/slide.css` はトークン込みの単一ファイルです。

```html
<!-- バージョンは必ず固定する (過去資料のデザインが変わらないように) -->
<link rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@nakagater/ui@0.1.0/dist/slides/slide.css">
```

またはファイルの中身を `<style>` タグに貼り付ければ完全オフラインの単一 HTML になります。

```html
<body class="deck">
  <section class="slide slide--title">
    <p class="slide-kicker">Kicker</p>
    <h1>タイトル</h1>
  </section>
  <section class="slide">
    <h2>見出し</h2>
    <div class="cols-2">
      <div class="card">...</div>
      <div class="card">...</div>
    </div>
  </section>
</body>
```

- 16:9 固定・ビューポートに自動フィット (本文 1em 基準で比例スケール)
- スクロール / PageDown でページ送り、ブラウザの印刷 → PDF 保存で 16:9 資料に
- `<html class="dark">` でダークデッキ
- 主なクラス: `.slide--title` `.slide--center` `.cols-2` `.cols-3` `.card`
  `.slide-kicker` `.slide-footer` `.accent` `.muted` `.small` `.notes` (非表示ノート)
- 雛形: [`dist/slides/template.html`](src/slides/template.html)

## 開発

```bash
pnpm install
pnpm storybook        # コンポーネントカタログ (ダークトグル付き)
pnpm build            # dist/ 生成 (tsdown + CSS アセット)
pnpm lint / typecheck / check:pkg
```

- トークンの単一ソースは `src/styles/tokens.css` (純 CSS 変数のみ。Tailwind 構文禁止 — ビルドで検査されます)
- コンポーネント追加: `pnpm dlx shadcn@latest add <name>` → `src/index.ts` に re-export 追加
  (CLI が CSS 変数を書き込んだ場合は `tokens.css` へ移動)
- コンポーネント内のクラス名は静的文字列のみ (利用側は dist をテキストスキャンするため)

## リリース

```bash
npm version minor && git push --follow-tags
```

タグ push で GitHub Actions が npm publish します (npm trusted publishing / OIDC。
初回のみ npmjs.com 側で Trusted Publisher の設定が必要)。
