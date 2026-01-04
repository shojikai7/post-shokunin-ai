# Post Shokunin AI 🎨

小規模事業者向けのSNS投稿生成アプリケーション。1回の入力でX、Instagram、TikTok、Googleビジネスプロフィール、note向けに最適化された投稿画像・投稿文・ハッシュタグを生成し、API投稿まで行えます。

## 特徴

- **マルチチャネル対応**: 1回の入力で5つのSNSプラットフォーム向けにコンテンツを生成
- **プロ品質の画像生成**: テンプレート感のない、ブランドに合わせたオリジナル画像
- **媒体別最適化**: 各プラットフォームの特性に合わせた文章構成とハッシュタグ
- **ブランド一貫性**: プロファイル設定でトーン・スタイルを統一

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| 認証・DB・Storage | Supabase (Auth + PostgreSQL + Storage) |
| テキスト生成 | Google Gemini 3.0 Flash |
| 画像生成 | Gemini Pro 3 Image API |
| ジョブワーカー | Cloud Run + Pub/Sub |
| デプロイ | Vercel (Web) + GCP (Worker) |

## セットアップ

### 前提条件

- Node.js 18+
- npm または yarn
- Supabase アカウント
- Google Cloud アカウント（Gemini API用）

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/post-shokunin-ai.git
cd post-shokunin-ai
```

### 2. 依存関係のインストール

```bash
# Web App
npm install

# Worker
cd worker
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して必要な値を設定:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. データベースのセットアップ

Supabase プロジェクトで以下のマイグレーションを実行:

```bash
# supabase/migrations/00001_initial_schema.sql を Supabase SQL Editor で実行
```

または Supabase CLI を使用:

```bash
supabase db push
```

### 5. ストレージバケットの作成

Supabase ダッシュボードで以下のバケットを作成:

- `brand-assets` (プライベート)
- `generated-media` (パブリック)

### 6. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリケーションにアクセス。

## プロジェクト構成

```
post-shokunin-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証関連ページ
│   │   ├── (dashboard)/       # ダッシュボード
│   │   └── api/               # API Routes
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/               # shadcn/ui
│   │   ├── composer/         # 投稿作成
│   │   ├── profile/          # プロファイル管理
│   │   └── dashboard/        # ダッシュボード
│   ├── lib/                   # ユーティリティ
│   │   ├── supabase/         # Supabase クライアント
│   │   ├── gemini/           # Gemini API
│   │   └── auth/             # 認証
│   └── types/                 # TypeScript型定義
├── worker/                    # Cloud Run Worker
│   ├── src/
│   │   ├── handlers/         # ジョブハンドラー
│   │   └── services/         # サービス
│   └── Dockerfile
├── supabase/
│   └── migrations/           # DBマイグレーション
└── docs/                      # ドキュメント
```

## 主要機能

### 1. プロファイル管理

ブランド情報とトーン設定を登録:

- ブランド名、サービス説明
- ターゲット、強み
- キャンペーン情報
- トーン設定（敬体/常体、絵文字、硬さ、CTA強度）
- 禁止表現、NGワード

### 2. 投稿作成（Composer）

ステップウィザード形式で投稿を作成:

1. **入力**: 投稿内容を入力
2. **チャネル選択**: 投稿先SNSを選択
3. **テキスト生成**: AI生成された投稿文を確認・編集
4. **画像生成**: プレビュー→本生成
5. **投稿/エクスポート**: API投稿またはダウンロード

### 3. ライブラリ

保存した投稿を管理:

- 一覧表示
- コピー/ダウンロード
- 再生成

### 4. SNS連携

OAuth連携で直接投稿:

- X (Twitter)
- Instagram
- Google ビジネスプロフィール
- TikTok (素材生成中心)

## デプロイ

### Web App (Vercel)

```bash
vercel deploy
```

### Worker (Cloud Run)

```bash
cd worker
gcloud builds submit --tag gcr.io/PROJECT_ID/post-shokunin-worker
gcloud run deploy post-shokunin-worker \
  --image gcr.io/PROJECT_ID/post-shokunin-worker \
  --platform managed \
  --region asia-northeast1
```

## API リファレンス

### POST /api/drafts/generate

投稿バリアントを生成

```json
{
  "profileId": "uuid",
  "inputText": "投稿内容",
  "eventInfo": null,
  "language": "ja",
  "channels": ["x", "instagram"]
}
```

### POST /api/images/preview

プレビュー画像を生成

```json
{
  "variantId": "uuid",
  "prompt": "画像プロンプト",
  "channel": "instagram"
}
```

### POST /api/publish

SNSに投稿

```json
{
  "variantId": "uuid",
  "channel": "x"
}
```

## 開発

### コーディング規約

- TypeScript strict mode
- ESLint + Prettier
- Conventional Commits

### テスト

```bash
npm run test        # ユニットテスト
npm run test:e2e    # E2Eテスト
```

## ライセンス

MIT

## 貢献

Issue や Pull Request を歓迎します。
