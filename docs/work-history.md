# 作業履歴

Post Shokunin AI プロジェクトの開発作業履歴を記録します。

---

## 2025-01-04 初期構築

### Phase 0: プロジェクト基盤構築

#### プロジェクト初期化
- **実施内容**:
  - Next.js 14 (App Router) + TypeScript プロジェクト作成
  - Tailwind CSS 設定
  - shadcn/ui 初期化・コンポーネント追加
  - 必要なnpmパッケージインストール

- **追加パッケージ**:
  - `@supabase/supabase-js` - Supabase クライアント
  - `@supabase/ssr` - Next.js SSR対応
  - `@google/generative-ai` - Gemini API
  - `zustand` - 状態管理
  - `zod` - バリデーション
  - `react-hook-form` - フォーム管理
  - `lucide-react` - アイコン
  - `date-fns` - 日付処理
  - `uuid` - UUID生成

- **shadcn/uiコンポーネント**:
  - button, input, label, card, form, textarea
  - select, tabs, badge, avatar, dropdown-menu
  - dialog, sheet, toast, separator, scroll-area
  - skeleton, switch, checkbox, radio-group
  - progress, alert, slider

#### 環境設定ファイル作成
- `.env.example` - 環境変数テンプレート
- 各種API キー設定項目の定義

#### 型定義作成
- `src/types/index.ts` - 全体の型定義
  - Channel, JobType, JobStatus 等のEnum型
  - ToneSettings, CampaignInfo, EventInfo
  - Profile, BrandAsset, Draft, ChannelVariant
  - GenerationJob, OutputAsset, PublishConnection
  - PublishAttempt, AuditLog
  - API Response Types, Error Codes
  - MEDIA_SIZES, CHANNEL_CONFIGS 定数

#### Supabase設定
- `src/lib/supabase/client.ts` - ブラウザクライアント
- `src/lib/supabase/server.ts` - サーバーサイドクライアント
- `src/lib/supabase/middleware.ts` - 認証ミドルウェア
- `src/middleware.ts` - Next.js ミドルウェア

---

### Phase 0: DBスキーマ作成

#### マイグレーションファイル
- `supabase/migrations/00001_initial_schema.sql`
  - profiles テーブル
  - brand_assets テーブル
  - drafts テーブル
  - channel_variants テーブル
  - generation_jobs テーブル
  - output_assets テーブル
  - publish_connections テーブル
  - publish_attempts テーブル
  - audit_logs テーブル
  - usage_records テーブル
  - Row Level Security (RLS) ポリシー
  - トリガー関数 (updated_at自動更新)
  - increment_usage 関数

- `supabase/migrations/00002_storage_buckets.sql`
  - Storage バケット設定ドキュメント

---

### Phase 1: 認証フロー実装

#### 認証アクション
- `src/lib/auth/actions.ts`
  - signInWithEmail - メール認証ログイン
  - signUpWithEmail - メール認証サインアップ
  - signOut - ログアウト
  - signInWithGoogle - Google OAuth
  - signInWithLine - LINE OIDC
  - getUser - ユーザー情報取得

#### 認証ページ
- `src/app/(auth)/login/page.tsx`
  - ログイン/サインアップ切り替え
  - Google/LINE ソーシャルログイン
  - メール/パスワードフォーム
  - Suspense 境界でuseSearchParamsをラップ

- `src/app/(auth)/layout.tsx` - 認証レイアウト

- `src/app/auth/callback/route.ts` - OAuth コールバック

- `src/app/auth/error/page.tsx` - 認証エラーページ

---

### Phase 1: プロファイル管理UI

#### プロファイルアクション
- `src/lib/profiles/actions.ts`
  - createProfile - 新規作成
  - updateProfile - 更新
  - deleteProfile - 削除
  - getProfile - 取得

#### プロファイルページ
- `src/app/(dashboard)/profiles/page.tsx` - 一覧
- `src/app/(dashboard)/profiles/new/page.tsx` - 新規作成
- `src/app/(dashboard)/profiles/[id]/edit/page.tsx` - 編集

#### プロファイルコンポーネント
- `src/components/profile/profile-form.tsx`
  - 基本情報フォーム
  - キャンペーン情報フォーム
  - トーン設定フォーム（スライダー付き）
  - 禁止表現・NGワード設定

---

### Phase 2: Composer UI実装

#### Composerページ
- `src/app/(dashboard)/compose/page.tsx`
  - 5ステップウィザード形式
  - プログレスバー表示
  - 状態管理（ComposerState）

#### Composerコンポーネント
- `src/components/composer/step1-input.tsx`
  - プロファイル選択
  - 投稿タイプ切り替え（通常/イベント）
  - 入力フォーム
  - 言語選択

- `src/components/composer/step2-channels.tsx`
  - チャネル選択（複数選択可）
  - チャネル情報表示

- `src/components/composer/step3-results.tsx`
  - 生成結果表示（タブ形式）
  - テキスト編集
  - ハッシュタグ表示
  - プロンプト編集
  - コピー機能

- `src/components/composer/step4-images.tsx`
  - 画像プレビュー
  - プレビュー生成
  - 本生成
  - ダウンロード

- `src/components/composer/step5-publish.tsx`
  - 投稿サマリー
  - チャネル別投稿選択
  - 一括ダウンロード
  - ライブラリ保存
  - 投稿実行

---

### Phase 2: バリアント生成API

#### APIエンドポイント
- `src/app/api/drafts/generate/route.ts`
  - Draft 作成
  - Gemini 3.0 Flash でテキスト/タグ/プロンプト生成
  - 各チャネル向けバリアント生成

- `src/app/api/drafts/[id]/save/route.ts`
  - Draft を保存済みに更新

- `src/app/api/images/preview/route.ts`
  - プレビュー画像生成ジョブ作成
  - OutputAsset 作成

- `src/app/api/images/final/route.ts`
  - 本生成画像生成ジョブ作成
  - 使用量カウント

- `src/app/api/publish/route.ts`
  - SNS投稿実行
  - PublishAttempt 作成
  - エラーハンドリング

#### Gemini設定
- `src/lib/gemini/client.ts` - Gemini クライアント
- `src/lib/gemini/prompts.ts` - プロンプトビルダー

---

### Phase 2: ライブラリ・設定

#### ライブラリページ
- `src/app/(dashboard)/library/page.tsx`
  - 保存済み投稿一覧
  - プレビュー画像表示
  - アクションメニュー

#### 設定ページ
- `src/app/(dashboard)/settings/page.tsx`
  - アカウント情報
  - 使用量表示
  - 連携アカウント管理
  - セキュリティ設定

---

### Phase 3: Cloud Run Worker構築

#### Worker基盤
- `worker/package.json` - 依存関係
- `worker/tsconfig.json` - TypeScript設定
- `worker/Dockerfile` - コンテナ設定

#### Workerエントリポイント
- `worker/src/index.ts`
  - Express サーバー
  - Pub/Sub push エンドポイント
  - ヘルスチェック

#### ジョブハンドラー
- `worker/src/handlers/generation.ts`
  - 画像生成ジョブ処理
  - ステータス更新
  - エラーハンドリング

- `worker/src/handlers/publish.ts`
  - SNS投稿ジョブ処理
  - コネクタ呼び出し

#### サービス
- `worker/src/services/image-generator.ts`
  - Gemini画像生成
  - プレースホルダー生成

- `worker/src/services/storage.ts`
  - Supabase Storage アップロード
  - 署名付きURL生成

#### SNSコネクタ
- `worker/src/services/connectors/x.ts` - X (Twitter) 投稿
- `worker/src/services/connectors/instagram.ts` - Instagram 投稿
- `worker/src/services/connectors/gbp.ts` - Google Business Profile 投稿

---

### その他

#### ダッシュボード
- `src/app/(dashboard)/layout.tsx` - レイアウト
- `src/app/(dashboard)/dashboard/page.tsx` - ダッシュボード
- `src/components/dashboard/nav.tsx` - ナビゲーション

#### ランディングページ
- `src/app/page.tsx` - トップページ
- `src/app/layout.tsx` - ルートレイアウト

#### ドキュメント
- `docs/api-requirements.md` - 外部API要件
- `docs/gemini-api-spec.md` - Gemini API仕様
- `docs/line-login-setup.md` - LINE Login設定ガイド
- `README.md` - プロジェクト概要

---

## ビルドエラー修正

### 修正した問題
1. **未使用変数の削除**
   - useEffect, user, ExternalLink, uuidv4, Shield
   - Alert, AlertDescription, error, hasAnyImage
   - updateState, router

2. **ESLint警告対応**
   - `jsx-a11y/alt-text` - aria-hidden属性追加
   - `@next/next/no-img-element` - eslint-disable-next-line追加
   - `react-hooks/exhaustive-deps` - eslint-disable-next-line追加

3. **TypeScript型エラー修正**
   - use-toast.ts の actionTypes 型定義修正
   - signInWithEmail/signUpWithEmail の戻り値型対応

4. **Next.js ビルドエラー修正**
   - useSearchParams を Suspense でラップ
   - tsconfig.json で worker ディレクトリを除外
   - .eslintrc.json で worker ディレクトリを除外

---

## 現在のプロジェクト状態

- **ビルド**: ✅ 成功
- **リンター**: ✅ エラーなし
- **型チェック**: ✅ パス

### 起動方法
```bash
npm run dev
```

### 必要な設定
1. Supabaseプロジェクト作成
2. 環境変数設定（.env.local）
3. DBマイグレーション実行
4. Gemini APIキー取得

