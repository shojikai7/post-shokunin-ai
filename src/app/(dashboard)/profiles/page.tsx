import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Edit, MoreHorizontal, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

export default async function ProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">プロファイル</h1>
          <p className="text-muted-foreground mt-1">
            ブランド情報とトーン設定を管理します
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
          <Link href="/profiles/new">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {/* Profiles Grid */}
      {profiles && profiles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center">
                      <Building2 className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profile.brand_name}</CardTitle>
                      <CardDescription className="text-xs">
                        {formatDistanceToNow(new Date(profile.created_at), { 
                          addSuffix: true, 
                          locale: ja 
                        })}に作成
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/profiles/${profile.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        削除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {profile.description_short || '説明未設定'}
                </p>
                <div className="flex flex-wrap gap-1">
                  {profile.tone_settings?.formality === 'formal' ? (
                    <Badge variant="secondary" className="text-xs">敬体</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">常体</Badge>
                  )}
                  {profile.tone_settings?.emojiUsage === 'heavy' && (
                    <Badge variant="secondary" className="text-xs">絵文字多め</Badge>
                  )}
                  {profile.campaign_info?.name && (
                    <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">
                      キャンペーン中
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/compose?profile=${profile.id}`}>
                      この設定で投稿作成
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">プロファイルがありません</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              ブランド情報を登録して、一貫性のある投稿を生成しましょう。
            </p>
            <Button asChild>
              <Link href="/profiles/new">
                <Plus className="mr-2 h-4 w-4" />
                最初のプロファイルを作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

