# Post Shokunin AI 仕様書 v1.0

## 1. 概要

### 1.1 目的
小規模事業者（個人事業主）が、1回の入力で X / Instagram / TikTok / Google Business Profile / Note 向けに、各媒体に最適化された「投稿画像・投稿文・ハッシュタグ」を生成し、ユーザー確認後に（可能な媒体は）API投稿まで行えるアプリケーション。

### 1.2 成功指標（MVP）
- 生成画像が「テンプレ感/素人感」を出さず、プロ品質（余白・整列・可読性・ブランド一貫性）が担保されること
- 主要導線：入力→プレビュー→本生成→（投稿/エクスポート）が破綻しないこと
- エラー時も必ず「手動投稿（DL/コピー）」へ着地できること

### 1.3 対象ユーザー
- 小規模事業者
- 個人事業主
- 店舗運営者
- SNSマーケティング担当者

---

## 2. 技術仕様

### 2.1 技術スタック

| 領域 | 技術 | バージョン |
|------|------|-----------|
| フロントエンド | Next.js (App Router) | 14.x |
| 言語 | TypeScript | 5.x |
| スタイリング | Tailwind CSS | 3.x |
| UIコンポーネント | shadcn/ui | Latest |
| 認証・DB・Storage | Supabase | Latest |
| テキスト生成 | Google Gemini 3.0 Flash | Latest |
| 画像生成 | Gemini Pro 3 Image API | Latest |
| ジョブワーカー | Cloud Run | Latest |
| メッセージング | Cloud Pub/Sub | Latest |
| Webデプロイ | Vercel | Latest |
| Workerデプロイ | Google Cloud Run | Latest |

### 2.2 アーキテクチャ

```
┌─────────────────────────────────────────────────────────┐
│                       Client                            │
│                    (Next.js App)                        │
└─────────────────────┬───────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────┐
│                      Vercel                              │
│                   (API Routes)                           │
└──────┬─────────────────────┬────────────────────────────┘
       │                     │
┌──────▼──────┐      ┌───────▼───────┐
│  Supabase   │      │  Cloud Pub/Sub│
│  ├─Auth     │      └───────┬───────┘
│  ├─DB       │              │
│  └─Storage  │      ┌───────▼───────┐
└─────────────┘      │  Cloud Run    │
                     │   Worker      │
                     └───────┬───────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
       ┌──────▼─────┐ ┌──────▼─────┐ ┌──────▼─────┐
       │ Gemini API │ │  SNS APIs  │ │  Storage   │
       └────────────┘ └────────────┘ └────────────┘
```

---

## 3. データベース設計

### 3.1 ER図

```
users (Supabase Auth)
  │
  ├── profiles (1:N)
  │     ├── brand_assets (1:N)
  │     └── drafts (1:N)
  │           └── channel_variants (1:N)
  │                 ├── generation_jobs (1:N)
  │                 ├── output_assets (1:N)
  │                 └── publish_attempts (1:N)
  │
  ├── publish_connections (1:N)
  ├── audit_logs (1:N)
  └── usage_records (1:N)
```

### 3.2 テーブル定義

#### profiles
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| brand_name | TEXT | ブランド名 |
| description_short | TEXT | 短い説明 |
| description_long | TEXT | 詳細説明 |
| target_audience | TEXT | ターゲット層 |
| strengths | TEXT | 強み |
| prohibited_expressions | TEXT[] | 禁止表現 |
| campaign_info | JSONB | キャンペーン情報 |
| reference_urls | TEXT[] | 参考URL |
| tone_settings | JSONB | トーン設定 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

#### drafts
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| profile_id | UUID | FK → profiles |
| input_text | TEXT | 入力テキスト |
| event_info | JSONB | イベント情報 |
| language | TEXT | 言語 (ja/en) |
| selected_channels | channel_type[] | 選択チャネル |
| is_saved | BOOLEAN | 保存済みフラグ |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

#### channel_variants
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| draft_id | UUID | FK → drafts |
| channel | channel_type | チャネル |
| post_text | TEXT | 投稿文 |
| hashtags | TEXT[] | ハッシュタグ |
| image_spec | JSONB | 画像仕様 |
| raw_prompt | TEXT | 生プロンプト |
| structured_prompt | TEXT | 構造化プロンプト |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

#### generation_jobs
| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID | PK |
| variant_id | UUID | FK → channel_variants |
| type | job_type | preview/final |
| status | job_status | ステータス |
| idempotency_key | TEXT | 冪等キー (UNIQUE) |
| error_code | TEXT | エラーコード |
| error_detail | TEXT | エラー詳細 |
| created_at | TIMESTAMPTZ | 作成日時 |
| updated_at | TIMESTAMPTZ | 更新日時 |

### 3.3 Enum定義

```sql
CREATE TYPE channel_type AS ENUM ('x', 'instagram', 'tiktok', 'gbp', 'note');
CREATE TYPE job_type AS ENUM ('preview', 'final');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE asset_type AS ENUM ('logo', 'product_photo', 'store_photo', 'font', 'template');
CREATE TYPE publish_provider AS ENUM ('x', 'meta', 'tiktok', 'google');
CREATE TYPE publish_status AS ENUM ('pending', 'succeeded', 'failed');
```

---

## 4. API設計

### 4.1 内部API

#### POST /api/drafts/generate
投稿バリアントを生成

**リクエスト:**
```json
{
  "profileId": "uuid",
  "inputText": "投稿内容",
  "eventInfo": {
    "title": "イベント名",
    "startDate": "2025-01-10",
    "endDate": "2025-01-20",
    "description": "詳細"
  },
  "language": "ja",
  "channels": ["x", "instagram", "gbp"]
}
```

**レスポンス:**
```json
{
  "draftId": "uuid",
  "variants": {
    "x": {
      "id": "uuid",
      "postText": "投稿文...",
      "hashtags": ["タグ1", "タグ2"],
      "rawPrompt": "英語プロンプト...",
      "structuredPrompt": "構造化..."
    }
  }
}
```

#### POST /api/images/preview
プレビュー画像を生成

**リクエスト:**
```json
{
  "variantId": "uuid",
  "prompt": "画像プロンプト",
  "channel": "instagram"
}
```

**レスポンス:**
```json
{
  "jobId": "uuid",
  "previewUrl": "https://...",
  "assetId": "uuid"
}
```

#### POST /api/images/final
本番画像を生成

**リクエスト/レスポンス:** preview と同様

#### POST /api/publish
SNSに投稿

**リクエスト:**
```json
{
  "variantId": "uuid",
  "channel": "x"
}
```

**レスポンス:**
```json
{
  "success": true,
  "attemptId": "uuid",
  "postId": "external-post-id"
}
```

### 4.2 エラーコード

| コード | 説明 | 対応アクション |
|--------|------|---------------|
| AUTH_EXPIRED | トークン期限切れ | 再連携 |
| AUTH_REVOKED | 連携解除済み | 再連携 |
| RATE_LIMITED | レート制限超過 | 待機後リトライ |
| INVALID_MEDIA_REQUIREMENTS | メディア形式不正 | 再生成 |
| DOMAIN_NOT_VERIFIED | ドメイン未検証 | 検証手順案内 |
| PPA_REQUIRED | ビジネス検証未完了 | PPA申請案内 |
| AUDIT_REQUIRED | コンテンツ審査中 | 待機 |
| TEMPORARY_FAILURE | 一時的エラー | リトライ |

---

## 5. 画面設計

### 5.1 画面一覧

| パス | 画面名 | 説明 |
|------|--------|------|
| / | ランディング | サービス紹介・CTA |
| /login | ログイン | 認証（Email/Google/LINE） |
| /dashboard | ダッシュボード | 統計・クイックアクション |
| /profiles | プロファイル一覧 | ブランド一覧 |
| /profiles/new | プロファイル新規 | ブランド登録 |
| /profiles/[id]/edit | プロファイル編集 | ブランド編集 |
| /compose | 投稿作成 | 5ステップウィザード |
| /library | ライブラリ | 保存済み投稿一覧 |
| /settings | 設定 | アカウント・連携・課金 |

### 5.2 Composer フロー

```
Step 1: 入力
├── プロファイル選択
├── 投稿タイプ（通常/イベント）
├── 入力テキスト
└── 言語選択
    ↓
Step 2: チャネル選択
├── X
├── Instagram
├── TikTok
├── Google Business Profile
└── note
    ↓
Step 3: テキスト生成結果
├── 投稿文（編集可）
├── ハッシュタグ
└── 画像プロンプト（編集可）
    ↓
Step 4: 画像生成
├── プレビュー生成
├── 確認・編集
└── 本生成
    ↓
Step 5: 投稿/エクスポート
├── 投稿先選択
├── API投稿実行
├── ダウンロード
└── ライブラリ保存
```

---

## 6. トーン設定仕様

### 6.1 設定項目

| 項目 | 値 | 説明 |
|------|-----|------|
| formality | formal/casual | 敬体/常体 |
| emojiUsage | none/moderate/heavy | 絵文字使用頻度 |
| endingStyle | string | 語尾スタイル（例：〜ね、〜だよ） |
| hardness | 1-5 | トーンの硬さ |
| ctaStrength | 1-5 | CTAの強さ |
| ngWords | string[] | NGワード |
| replacements | {from, to}[] | 言い換えルール |

### 6.2 JSONスキーマ

```json
{
  "formality": "formal",
  "emojiUsage": "moderate",
  "endingStyle": "〜ます",
  "hardness": 3,
  "ctaStrength": 3,
  "ngWords": ["激安", "最安値"],
  "replacements": [
    {"from": "安い", "to": "お得"}
  ]
}
```

---

## 7. チャネル別仕様

### 7.1 出力サイズ

| チャネル | アスペクト比 | 推奨サイズ |
|----------|-------------|-----------|
| X | 16:9 | 1200x675px |
| Instagram | 1:1 | 1080x1080px |
| TikTok | 9:16 | 1080x1920px |
| GBP | 4:3 | 1200x900px |
| note | 16:9 | 1280x720px |

### 7.2 文字数・タグ数制限

| チャネル | 最大文字数 | 最大タグ数 | API投稿 |
|----------|-----------|-----------|---------|
| X | 280 | 5 | ✅ |
| Instagram | 2,200 | 30 | ✅ |
| TikTok | 2,200 | 10 | 🔸 オプション |
| GBP | 1,500 | 0 | ✅ |
| note | 10,000 | 10 | ❌ 手動のみ |

---

## 8. セキュリティ仕様

### 8.1 認証

- Supabase Auth による認証
- 対応プロバイダー:
  - Email/Password
  - Google OAuth
  - LINE OIDC（カスタムプロバイダー）

### 8.2 認可

- Row Level Security (RLS) によるデータ保護
- ユーザーは自分のデータのみアクセス可能

### 8.3 トークン保護

- SNS連携トークンは暗号化して保存
- 最小スコープ原則
- 期限管理・ローテーション

### 8.4 監査ログ

記録対象アクション:
- 認証イベント（ログイン/ログアウト）
- プロファイル操作（作成/更新/削除）
- 生成実行
- 投稿実行
- 連携操作

---

## 9. 課金仕様

### 9.1 プラン

| プラン | 月額生成数 | 価格 |
|--------|-----------|------|
| Free | 100件 | ¥0 |
| Pro | 500件 | TBD |
| Enterprise | 無制限 | TBD |

### 9.2 カウント対象

- 本生成（finalジョブ）= 1カウント
- プレビュー生成 = カウント対象外
- 投稿実行 = カウント対象外

### 9.3 使用量管理

- `usage_records` テーブルで月別管理
- `increment_usage` 関数でアトミックに加算

---

## 10. 運用仕様

### 10.1 監視項目

- ジョブ成功率
- 平均処理時間
- 外部API失敗率（媒体別）
- レート制限発生回数
- ストレージ使用量

### 10.2 アラート条件

- 連続失敗（同一プロバイダでn回）
- ジョブ滞留（queuedが閾値超過）
- 外部API 5xx増加

### 10.3 バックアップ

- DB: 日次バックアップ
- Storage: ライフサイクル管理（未保存資産の自動削除）

---

## 11. 非機能要件

### 11.1 可用性

- 外部API障害時も「生成済み成果物のDL/コピー」は可能

### 11.2 性能

- プレビュー生成: 体感5〜15秒
- 超過時: 非同期＋通知

### 11.3 スケーラビリティ

- Cloud Run による水平スケーリング
- Pub/Sub によるジョブ分散

---

## 12. 制限事項（MVP）

以下はMVPスコープ外:

- 予約投稿（スケジュール投稿）
- A/Bテスト自動運用
- 分析ダッシュボード
- マルチアカウント/チーム権限
- IGリール/ストーリー
- TikTok動画生成・自動編集
- ライブラリの高度検索

---

## 付録

### A. 環境変数一覧

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gemini
GEMINI_API_KEY=

# SNS OAuth
X_CLIENT_ID=
X_CLIENT_SECRET=
META_CLIENT_ID=
META_CLIENT_SECRET=
GBP_CLIENT_ID=
GBP_CLIENT_SECRET=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=

# Security
ENCRYPTION_KEY=

# App
NEXT_PUBLIC_APP_URL=
WORKER_URL=
GCP_PROJECT_ID=
GCP_PUBSUB_TOPIC=
```

### B. ディレクトリ構成

```
post-shokunin-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 認証ページ
│   │   ├── (dashboard)/       # ダッシュボード
│   │   ├── api/               # API Routes
│   │   └── auth/              # Auth callbacks
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/               # shadcn/ui
│   │   ├── composer/         # 投稿作成
│   │   ├── profile/          # プロファイル
│   │   └── dashboard/        # ダッシュボード
│   ├── lib/                   # ユーティリティ
│   │   ├── supabase/         # Supabase
│   │   ├── gemini/           # Gemini API
│   │   ├── auth/             # 認証
│   │   └── profiles/         # プロファイル
│   ├── hooks/                 # カスタムフック
│   └── types/                 # 型定義
├── worker/                    # Cloud Run Worker
│   ├── src/
│   │   ├── handlers/         # ジョブハンドラー
│   │   └── services/         # サービス
│   └── Dockerfile
├── supabase/
│   └── migrations/           # DBマイグレーション
└── docs/                      # ドキュメント
```

### C. 参照ドキュメント

- [外部API要件](./api-requirements.md)
- [Gemini API仕様](./gemini-api-spec.md)
- [LINE Login設定](./line-login-setup.md)
- [作業履歴](./work-history.md)
- [タスク管理](./task-management.md)

