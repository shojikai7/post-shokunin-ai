import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PenTool, UserCircle, Library, Settings, ArrowRight, Sparkles } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get profile count
  const { count: profileCount } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id);

  // Get draft count
  const { count: draftCount } = await supabase
    .from('drafts')
    .select('*, profiles!inner(*)', { count: 'exact', head: true })
    .eq('profiles.user_id', user?.id)
    .eq('is_saved', true);

  const hasProfiles = (profileCount ?? 0) > 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          おかえりなさい 👋
        </h1>
        <p className="text-muted-foreground mt-2">
          SNS投稿を効率的に作成しましょう
        </p>
      </div>

      {/* Quick Actions */}
      {!hasProfiles ? (
        <Card className="border-dashed border-2 border-violet-200 bg-violet-50/50">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">まずはプロファイルを作成</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              ブランド情報やトーン設定を登録して、一貫性のある投稿を生成できるようにしましょう。
            </p>
            <Button asChild className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
              <Link href="/profiles/new">
                <UserCircle className="mr-2 h-4 w-4" />
                プロファイルを作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white">
          <CardContent className="flex items-center justify-between py-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">新しい投稿を作成</h2>
              <p className="text-white/80">
                1回の入力で複数のSNS向けコンテンツを生成
              </p>
            </div>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-violet-600 hover:bg-white/90"
              asChild
            >
              <Link href="/compose">
                <PenTool className="mr-2 h-5 w-5" />
                投稿を作成
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">プロファイル</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">登録済みブランド</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保存済み投稿</CardTitle>
            <Library className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">ライブラリ内</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今月の生成</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0 / 100</div>
            <p className="text-xs text-muted-foreground">月間利用可能数</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">連携アカウント</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">SNS連携数</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <Link href="/profiles">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-violet-500" />
                プロファイル管理
              </CardTitle>
              <CardDescription>
                ブランド情報やトーン設定を管理
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/library">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-blue-500" />
                ライブラリ
              </CardTitle>
              <CardDescription>
                過去の投稿を確認・再利用
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <Link href="/settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-500" />
                設定
              </CardTitle>
              <CardDescription>
                SNS連携や課金設定を管理
              </CardDescription>
            </CardHeader>
          </Link>
        </Card>
      </div>
    </div>
  );
}

