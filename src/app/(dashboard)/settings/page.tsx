import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Link2, 
  Link2Off, 
  CreditCard, 
  Shield, 
  Bell,
  User
} from 'lucide-react';

const providers = [
  { 
    id: 'x', 
    name: 'X (Twitter)', 
    description: '画像付きツイートを投稿',
    color: 'bg-black' 
  },
  { 
    id: 'meta', 
    name: 'Instagram', 
    description: 'フィード投稿（1枚画像）',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500' 
  },
  { 
    id: 'google', 
    name: 'Googleビジネスプロフィール', 
    description: 'イベント・特典・最新情報',
    color: 'bg-blue-500' 
  },
  { 
    id: 'tiktok', 
    name: 'TikTok', 
    description: '素材生成（API投稿はオプション）',
    color: 'bg-black' 
  },
];

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get connected accounts
  const { data: connections } = await supabase
    .from('publish_connections')
    .select('*')
    .eq('user_id', user?.id);

  // Get usage for current month
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const { data: usage } = await supabase
    .from('usage_records')
    .select('*')
    .eq('user_id', user?.id)
    .eq('month', currentMonth)
    .single();

  const generationCount = usage?.generation_count ?? 0;
  const publishCount = usage?.publish_count ?? 0;
  const monthlyLimit = 100;
  const usagePercent = (generationCount / monthlyLimit) * 100;

  const connectedProviders = new Set(connections?.map(c => c.provider) ?? []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">設定</h1>
        <p className="text-muted-foreground mt-1">
          アカウントと連携設定を管理します
        </p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            アカウント情報
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{user?.user_metadata?.full_name || 'ユーザー'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm">
              編集
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            使用量
          </CardTitle>
          <CardDescription>
            今月の利用状況
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>画像生成</span>
              <span className="font-medium">{generationCount} / {monthlyLimit}</span>
            </div>
            <Progress value={usagePercent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              月間 {monthlyLimit} 件まで無料
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{generationCount}</p>
              <p className="text-sm text-muted-foreground">生成数</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{publishCount}</p>
              <p className="text-sm text-muted-foreground">投稿数</p>
            </div>
          </div>

          <Button variant="outline" className="w-full">
            <CreditCard className="mr-2 h-4 w-4" />
            プランをアップグレード
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            連携アカウント
          </CardTitle>
          <CardDescription>
            SNSアカウントを連携して投稿機能を有効化
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers.map((provider) => {
            const isConnected = connectedProviders.has(provider.id);
            const connection = connections?.find(c => c.provider === provider.id);

            return (
              <div
                key={provider.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-lg ${provider.color} flex items-center justify-center text-white text-sm font-bold`}>
                    {provider.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {provider.description}
                    </p>
                    {isConnected && connection?.account_name && (
                      <p className="text-xs text-green-600 mt-1">
                        @{connection.account_name} として連携中
                      </p>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-700">連携中</Badge>
                    <Button variant="ghost" size="sm">
                      <Link2Off className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm">
                    <Link2 className="mr-2 h-4 w-4" />
                    連携
                  </Button>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            セキュリティ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">パスワード変更</p>
              <p className="text-sm text-muted-foreground">
                アカウントのパスワードを変更
              </p>
            </div>
            <Button variant="outline" size="sm">
              変更
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">二要素認証</p>
              <p className="text-sm text-muted-foreground">
                追加のセキュリティレイヤーを設定
              </p>
            </div>
            <Badge variant="outline">未設定</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            通知設定は今後のアップデートで追加予定です。
          </p>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">危険な操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">アカウント削除</p>
              <p className="text-sm text-muted-foreground">
                アカウントとすべてのデータを完全に削除
              </p>
            </div>
            <Button variant="destructive" size="sm">
              削除
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

