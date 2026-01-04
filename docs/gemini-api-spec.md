# Gemini API 仕様書

## 1. Gemini 3.0 Flash（テキスト生成）

### 用途
- 投稿文生成
- ハッシュタグ生成
- 画像生成用プロンプト生成

### APIエンドポイント
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-3.0-flash:generateContent
```

### 主要パラメータ
| パラメータ | 説明 | 推奨値 |
|-----------|------|--------|
| `temperature` | 創造性 | 0.7〜0.9 |
| `maxOutputTokens` | 最大出力トークン | 2048 |
| `topP` | 確率分布 | 0.95 |
| `topK` | サンプリング | 40 |

### レート制限
- RPM（Requests Per Minute）: 60
- TPM（Tokens Per Minute）: 1,000,000

### 料金（参考）
- 入力: $0.075 / 1M tokens
- 出力: $0.30 / 1M tokens

---

## 2. Gemini Pro 3 Image API（画像生成）

### 用途
- プレビュー画像生成
- 本生成（高品質画像）

### APIエンドポイント
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-3-image:generateImage
```

### 主要パラメータ
| パラメータ | 説明 | 値 |
|-----------|------|-----|
| `prompt` | 生成指示 | 文字列 |
| `negativePrompt` | 除外指示 | 文字列（オプション） |
| `aspectRatio` | アスペクト比 | `1:1`, `16:9`, `9:16`, `4:3`, `3:4` |
| `numberOfImages` | 生成枚数 | 1〜4 |
| `personGeneration` | 人物生成 | `ALLOW_ADULT`, `DONT_ALLOW` |

### 出力サイズ
| モード | 解像度 | 用途 |
|--------|--------|------|
| プレビュー | 512x512相当 | 低コスト確認用 |
| 本生成 | 1024x1024以上 | 最終出力用 |

### アスペクト比と推奨サイズ
| アスペクト比 | 出力サイズ | 対象媒体 |
|-------------|-----------|----------|
| 1:1 | 1024x1024 | Instagram |
| 16:9 | 1344x768 | X, Note |
| 9:16 | 768x1344 | TikTok |
| 4:3 | 1152x896 | GBP |

### 参照画像入力（Image-to-Image）
- Brand Assets（ロゴ、商品写真）を参照画像として入力可能
- `referenceImages` パラメータで指定

### 安全フィルター
- 不適切コンテンツは自動ブロック
- `safetySettings` で調整可能

### レート制限
- RPM: 10
- 1日あたり: 500リクエスト（無料枠）

### 料金（参考）
- 画像1枚: $0.02〜$0.04（サイズによる）

---

## 3. SDK使用例

### インストール
```bash
npm install @google/generative-ai
```

### テキスト生成
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });

const result = await model.generateContent({
  contents: [{ role: 'user', parts: [{ text: prompt }] }],
  generationConfig: {
    temperature: 0.8,
    maxOutputTokens: 2048,
  },
});
```

### 画像生成
```typescript
const imageModel = genAI.getGenerativeModel({ model: 'gemini-pro-3-image' });

const result = await imageModel.generateImage({
  prompt: 'プロンプト',
  aspectRatio: '1:1',
  numberOfImages: 1,
});
```

---

## 4. エラーハンドリング

| エラーコード | 意味 | 対応 |
|-------------|------|------|
| `RESOURCE_EXHAUSTED` | レート制限 | 待機後リトライ |
| `INVALID_ARGUMENT` | パラメータ不正 | パラメータ確認 |
| `PERMISSION_DENIED` | APIキー無効 | キー確認 |
| `SAFETY` | 安全フィルターブロック | プロンプト修正 |

---

## 5. プロンプト設計ガイドライン

### 投稿文生成
```
あなたは{channel}向けのSNS投稿を作成するプロです。

【ブランド情報】
- ブランド名: {brand_name}
- サービス説明: {description}
- ターゲット: {target_audience}
- 強み: {strengths}
- トーン: {tone_settings}

【投稿内容】
{input_text}

【制約】
- 文字数: {max_chars}文字以内
- 禁止表現: {prohibited_expressions}
- {additional_constraints}

以下の形式で出力してください:
- 投稿文
- ハッシュタグ（{hashtag_count}個）
```

### 画像プロンプト生成
```
以下の投稿に最適なSNS投稿画像のプロンプトを生成してください。

【投稿内容】
{post_text}

【ブランドスタイル】
- メインカラー: {brand_color}
- スタイル: {visual_style}
- ロゴ配置: {logo_position}

【出力形式】
- 英語で詳細な画像生成プロンプト
- ネガティブプロンプト
```

