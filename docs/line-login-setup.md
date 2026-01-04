# LINE Login 実装ガイド（Supabase OIDC）

## 概要

SupabaseはOIDC (OpenID Connect) プロトコルをサポートしており、LINE Loginを Custom OIDC Provider として設定可能です。

## 前提条件

1. LINE Developers アカウント
2. LINE Login チャネル作成済み
3. Supabase プロジェクト

---

## 1. LINE Developers 設定

### チャネル作成
1. [LINE Developers Console](https://developers.line.biz/) にログイン
2. 新規プロバイダー作成（または既存を選択）
3. 「LINE Login」チャネルを作成

### 必要な情報
| 項目 | 値 |
|------|-----|
| Channel ID | `{your_channel_id}` |
| Channel Secret | `{your_channel_secret}` |

### コールバックURL設定
```
https://{your-project}.supabase.co/auth/v1/callback
```

### OpenID Connect設定
- 「OpenID Connect」を**有効**にする
- メールアドレス取得を有効化（オプション）

---

## 2. Supabase 設定

### Authentication > Providers > OIDC

| 設定項目 | 値 |
|----------|-----|
| Enabled | ON |
| Name | `line` |
| Client ID | `{LINE Channel ID}` |
| Client Secret | `{LINE Channel Secret}` |
| Issuer URL | `https://access.line.me` |
| OIDC Discovery URL | `https://access.line.me/.well-known/openid-configuration` |
| Scopes | `openid profile email` |

### 詳細設定
```
Authorization URL: https://access.line.me/oauth2/v2.1/authorize
Token URL: https://api.line.me/oauth2/v2.1/token
User Info URL: https://api.line.me/v2/profile
JWKS URL: https://api.line.me/oauth2/v2.1/certs
```

---

## 3. フロントエンド実装

### Supabase Client 設定
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### LINE Login ボタン
```typescript
const signInWithLine = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'line' as any, // カスタムプロバイダー
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      scopes: 'openid profile email',
    },
  });
  
  if (error) {
    console.error('LINE Login error:', error);
  }
};
```

### コールバック処理
```typescript
// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

---

## 4. 注意事項

### LINE固有の制約
- LINEアカウントにメールアドレスが未設定の場合、email は null
- プロフィール画像URLは一定期間で期限切れ
- LINE User ID は LINE Login チャネルごとに異なる

### MVP対応方針
1. メールが取得できない場合は LINE ID をユーザー識別子として使用
2. プロフィール画像は Supabase Storage にコピー保存
3. 初回ログイン時にメールアドレス任意入力を促す

---

## 5. トラブルシューティング

| 問題 | 原因 | 解決策 |
|------|------|--------|
| `invalid_client` | Channel ID/Secret 不正 | 値を再確認 |
| `invalid_redirect_uri` | コールバックURL未登録 | LINE Developers で登録 |
| OpenID Connect エラー | OIDC未有効 | チャネル設定で有効化 |
| email が null | ユーザー未設定 | 任意入力フォーム表示 |

---

## 6. 代替案（MVPで難航時）

LINE Login が Supabase OIDC で問題が発生した場合：

1. **NextAuth.js 併用**: LINE provider が公式サポート
2. **カスタム実装**: LINE SDK を使い、Supabase Auth との連携を自前実装
3. **MVP除外**: Google/Email のみでリリース、LINE は後続対応

推奨: まず Supabase OIDC で実装を試み、問題発生時は NextAuth.js 併用を検討

