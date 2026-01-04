# 外部API要件仕様書

## 1. X (Twitter) API v2

### アカウント要件
- Developer Account（Basic以上推奨）
- OAuth 2.0 User Authentication

### 必須スコープ
- `tweet.read`
- `tweet.write`
- `users.read`
- `offline.access`（refresh token用）

### メディア要件
| 項目 | 仕様 |
|------|------|
| 画像形式 | JPEG, PNG, GIF, WEBP |
| 最大サイズ | 5MB |
| 推奨アスペクト比 | 16:9, 1:1 |
| 推奨解像度 | 1200x675px (16:9), 1080x1080px (1:1) |

### 文字数制限
- ツイート本文: 280文字（日本語は140文字相当）

### レート制限
- ツイート投稿: 200回/15分（ユーザー単位）
- メディアアップロード: 別途制限あり

### エラーコード
- `401`: AUTH_EXPIRED / AUTH_REVOKED
- `429`: RATE_LIMITED
- `403`: PERMISSION_DENIED
- `5xx`: TEMPORARY_FAILURE

---

## 2. Instagram Graph API

### アカウント要件
- Facebookビジネスページ
- InstagramプロフェッショナルアカウントまたはCreatorアカウント
- Meta Developer App
- **PPA (Page Public Content Access)**: ビジネス検証が必要

### 必須スコープ
- `instagram_basic`
- `instagram_content_publish`
- `pages_read_engagement`
- `pages_show_list`

### メディア要件
| 項目 | 仕様 |
|------|------|
| 画像形式 | JPEG, PNG |
| 最大サイズ | 8MB |
| アスペクト比 | 1.91:1 〜 4:5（推奨: 1:1） |
| 推奨解像度 | 1080x1080px (1:1), 1080x1350px (4:5) |
| 最小解像度 | 320x320px |

### 文字数制限
- キャプション: 2,200文字
- ハッシュタグ: 最大30個

### 重要な制約
- 画像URLは**公開アクセス可能**でなければならない
- URLのドメインは特定要件なし（ただし有効期間内にアクセス可能であること）

### エラーコード
- `190`: AUTH_EXPIRED
- `4`: RATE_LIMITED
- `36003`: INVALID_MEDIA_REQUIREMENTS
- `PPA_REQUIRED`: ビジネス検証未完了

---

## 3. TikTok Content Posting API

### アカウント要件
- TikTok Developer Account
- App審査通過必須
- **ドメイン検証**: コールバックURLのドメイン所有証明が必要

### 必須スコープ
- `user.info.basic`
- `video.publish`（動画投稿用）
- `video.upload`

### メディア要件（Photo Mode）
| 項目 | 仕様 |
|------|------|
| 画像形式 | JPEG, PNG, WEBP |
| 最大サイズ | 20MB |
| 推奨アスペクト比 | 9:16（縦長推奨） |
| 推奨解像度 | 1080x1920px |

### 文字数制限
- キャプション: 2,200文字
- ハッシュタグ: 制限なし（ただし多すぎるとスパム判定）

### 重要な制約
- **ドメイン検証必須**: メディアURLのドメインが事前検証済みである必要
- 動画投稿は審査プロセスあり

### エラーコード
- `access_token_invalid`: AUTH_EXPIRED
- `rate_limit_exceeded`: RATE_LIMITED
- `domain_not_verified`: DOMAIN_NOT_VERIFIED
- `audit_required`: AUDIT_REQUIRED

---

## 4. Google Business Profile API

### アカウント要件
- Google Business Profileアカウント
- ビジネスオーナー確認済み
- Google Cloud Project

### 必須スコープ
- `https://www.googleapis.com/auth/business.manage`

### 投稿タイプ
| タイプ | 用途 | 必須フィールド |
|--------|------|----------------|
| `STANDARD` | 最新情報 | summary |
| `EVENT` | イベント | summary, event.title, event.schedule |
| `OFFER` | 特典/クーポン | summary, offer.couponCode, offer.termsConditions |

### メディア要件
| 項目 | 仕様 |
|------|------|
| 画像形式 | JPEG, PNG |
| 最大サイズ | 5MB |
| 推奨アスペクト比 | 4:3 |
| 推奨解像度 | 1200x900px |
| 最小解像度 | 250x250px |

### 文字数制限
- サマリー: 1,500文字
- CTA: 利用可能（電話、予約、詳細など）

### エラーコード
- `401`: AUTH_EXPIRED
- `403`: PERMISSION_DENIED
- `429`: RATE_LIMITED
- `400`: INVALID_REQUEST

---

## 5. Note (note.com)

### 投稿方式
- **API投稿なし**: 手動投稿のみ
- アプリからは画像一括ダウンロード + Markdownコピー機能を提供

### 推奨形式
- 画像: 1280x720px以上（横長推奨）
- 本文: Markdown形式でコピー

---

## 媒体別推奨サイズまとめ

| 媒体 | 推奨サイズ | アスペクト比 |
|------|-----------|-------------|
| X (Twitter) | 1200x675px | 16:9 |
| Instagram | 1080x1080px | 1:1 |
| TikTok | 1080x1920px | 9:16 |
| GBP | 1200x900px | 4:3 |
| Note | 1280x720px | 16:9 |

---

## 共通エラーコード（正規化）

| コード | 意味 | 対応アクション |
|--------|------|---------------|
| AUTH_EXPIRED | トークン期限切れ | 再連携 |
| AUTH_REVOKED | ユーザーが連携解除 | 再連携 |
| RATE_LIMITED | レート制限超過 | 待機後リトライ |
| INVALID_MEDIA_REQUIREMENTS | メディア形式不正 | 形式変換/再生成 |
| DOMAIN_NOT_VERIFIED | ドメイン未検証 | 検証手順案内 |
| PPA_REQUIRED | ビジネス検証未完了 | PPA申請案内 |
| AUDIT_REQUIRED | コンテンツ審査中 | 待機 |
| TEMPORARY_FAILURE | 一時的エラー | リトライ |
| PERMISSION_DENIED | 権限不足 | スコープ確認 |

