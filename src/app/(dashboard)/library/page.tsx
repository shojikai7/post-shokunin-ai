import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Library, Plus, MoreHorizontal, Copy, Download, RefreshCw, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CHANNEL_CONFIGS } from '@/types';

export default async function LibraryPage() {
  const supabase = await createClient();
  
  const { data: drafts } = await supabase
    .from('drafts')
    .select(`
      *,
      profiles (brand_name),
      channel_variants (
        id,
        channel,
        post_text,
        hashtags,
        output_assets (
          id,
          kind,
          public_url
        )
      )
    `)
    .eq('is_saved', true)
    .order('created_at', { ascending: false });

  // Filter drafts that belong to user's profiles
  const userDrafts = drafts?.filter(draft => {
    // Already filtered by RLS, but double-check
    return draft.profiles;
  }) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ライブラリ</h1>
          <p className="text-muted-foreground mt-1">
            保存した投稿を管理します
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
          <Link href="/compose">
            <Plus className="mr-2 h-4 w-4" />
            新規作成
          </Link>
        </Button>
      </div>

      {/* Library Grid */}
      {userDrafts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {userDrafts.map((draft) => {
            // Get first variant with final image
            const variantWithImage = draft.channel_variants?.find(
              (v: { output_assets?: { kind: string; public_url: string }[] }) => 
                v.output_assets?.some((a: { kind: string }) => a.kind === 'final')
            );
            const previewImage = variantWithImage?.output_assets?.find(
              (a: { kind: string }) => a.kind === 'final'
            )?.public_url;

            return (
              <Card key={draft.id} className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Preview Image */}
                <div className="aspect-video bg-slate-100 relative">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt="投稿プレビュー"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Library className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Copy className="mr-2 h-4 w-4" />
                          コピー
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          ダウンロード
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          再生成
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          削除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base line-clamp-1">
                        {draft.input_text}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {draft.profiles?.brand_name} ・{' '}
                        {formatDistanceToNow(new Date(draft.created_at), {
                          addSuffix: true,
                          locale: ja,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1">
                    {draft.selected_channels?.map((channelId: string) => {
                      const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
                      return (
                        <Badge key={channelId} variant="secondary" className="text-xs">
                          {channel?.name || channelId}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Library className="h-8 w-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">ライブラリは空です</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              投稿を作成して保存すると、ここに表示されます。
            </p>
            <Button asChild>
              <Link href="/compose">
                <Plus className="mr-2 h-4 w-4" />
                最初の投稿を作成
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

