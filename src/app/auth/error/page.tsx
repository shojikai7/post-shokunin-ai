import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams.error;

  const errorMessages: Record<string, string> = {
    auth_callback_error: '認証処理中にエラーが発生しました。もう一度お試しください。',
    access_denied: 'アクセスが拒否されました。',
    invalid_request: '無効なリクエストです。',
  };

  const message = error ? errorMessages[error] || '不明なエラーが発生しました。' : '不明なエラーが発生しました。';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">認証エラー</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild className="w-full">
            <Link href="/login">ログインページに戻る</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

