'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithLine } from '@/lib/auth/actions';
import { Loader2, Mail, Chrome } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEmailAuth = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    formData.append('redirect', redirectTo);

    if (isLogin) {
      const result = await signInWithEmail(formData);
      if (result?.error) {
        setError(result.error);
      }
    } else {
      const result = await signUpWithEmail(formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        setSuccess(result.success);
      }
    }

    setIsLoading(false);
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  const handleLineLogin = async () => {
    setIsLoading(true);
    setError(null);
    const result = await signInWithLine();
    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md relative bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto mb-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">職</span>
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          Post Shokunin AI
        </CardTitle>
        <CardDescription>
          {isLogin ? 'アカウントにログイン' : '新規アカウント作成'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full h-11 gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome className="h-5 w-5" />
            Googleでログイン
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-11 gap-2 bg-[#00B900] hover:bg-[#00A000] text-white hover:text-white border-[#00B900]"
            onClick={handleLineLogin}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
            </svg>
            LINEでログイン
          </Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">または</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form action={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="your@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={6}
              disabled={isLoading}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                処理中...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {isLogin ? 'ログイン' : 'アカウント作成'}
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col gap-4">
        <Button 
          variant="link" 
          className="text-sm text-muted-foreground"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
            setSuccess(null);
          }}
        >
          {isLogin 
            ? 'アカウントをお持ちでない方はこちら' 
            : 'すでにアカウントをお持ちの方はこちら'}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          ログインすることで、
          <Link href="/terms" className="underline hover:text-foreground">
            利用規約
          </Link>
          と
          <Link href="/privacy" className="underline hover:text-foreground">
            プライバシーポリシー
          </Link>
          に同意したものとみなされます。
        </p>
      </CardFooter>
    </Card>
  );
}

function LoginFormSkeleton() {
  return (
    <Card className="w-full max-w-md relative bg-white/95 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center space-y-2">
        <Skeleton className="h-12 w-12 rounded-xl mx-auto" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-11 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />
      
      <Suspense fallback={<LoginFormSkeleton />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
