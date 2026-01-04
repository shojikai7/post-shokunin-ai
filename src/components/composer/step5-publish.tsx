'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Send, 
  Download, 
  Copy, 
  Check, 
  AlertCircle,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { CHANNEL_CONFIGS, type Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { ComposerState } from '@/app/(dashboard)/compose/page';

interface ComposerStep5Props {
  state: ComposerState;
  updateState: (updates: Partial<ComposerState>) => void;
  onBack: () => void;
}

export function ComposerStep5({ state, onBack }: ComposerStep5Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedForPublish, setSelectedForPublish] = useState<Channel[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishStatus, setPublishStatus] = useState<Record<Channel, 'pending' | 'success' | 'error'>>({} as never);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const togglePublishChannel = (channel: Channel) => {
    setSelectedForPublish((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'コピーしました',
      description: 'クリップボードにコピーしました',
    });
  };

  const handlePublish = async () => {
    if (selectedForPublish.length === 0) return;

    setIsPublishing(true);

    for (const channel of selectedForPublish) {
      setPublishStatus((prev) => ({ ...prev, [channel]: 'pending' }));

      try {
        const response = await fetch('/api/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantId: state.variants[channel]?.id,
            channel,
          }),
        });

        if (response.ok) {
          setPublishStatus((prev) => ({ ...prev, [channel]: 'success' }));
        } else {
          throw new Error();
        }
      } catch {
        setPublishStatus((prev) => ({ ...prev, [channel]: 'error' }));
      }
    }

    setIsPublishing(false);
    toast({
      title: '投稿完了',
      description: `${selectedForPublish.length}件の投稿を処理しました`,
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/drafts/${state.draftId}/save`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: '保存しました',
          description: 'ライブラリに保存されました',
        });
        router.push('/library');
      }
    } catch {
      toast({
        title: 'エラー',
        description: '保存に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadAll = () => {
    state.selectedChannels.forEach((channel) => {
      const imageState = state.generatedImages[channel];
      const url = imageState?.finalUrl || imageState?.previewUrl;
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${channel}-post.png`;
        a.click();
      }
    });
    toast({
      title: 'ダウンロード開始',
      description: `${state.selectedChannels.length}件の画像をダウンロードしています`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>投稿準備完了</CardTitle>
          <CardDescription>
            生成されたコンテンツを確認し、投稿またはエクスポートしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {state.selectedChannels.map((channelId) => {
              const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
              const variant = state.variants[channelId];
              const imageState = state.generatedImages[channelId];
              const status = publishStatus[channelId];

              return (
                <div
                  key={channelId}
                  className="flex items-start gap-4 p-4 rounded-lg border"
                >
                  {/* Image Preview */}
                  <div
                    className="w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    {imageState?.finalUrl || imageState?.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={imageState.finalUrl || imageState.previewUrl}
                        alt="投稿画像プレビュー"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{channel?.nameJa}</h4>
                      {channel?.supportsApiPost ? (
                        <Badge variant="secondary" className="text-xs">
                          API投稿対応
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          手動投稿
                        </Badge>
                      )}
                      {status === 'success' && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          投稿済み
                        </Badge>
                      )}
                      {status === 'error' && (
                        <Badge variant="destructive" className="text-xs">
                          エラー
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {variant?.postText}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleCopy(
                            `${variant?.postText}\n\n${variant?.hashtags.map((t) => `#${t}`).join(' ')}`,
                            `copy-${channelId}`
                          )
                        }
                      >
                        {copiedField === `copy-${channelId}` ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        <span className="ml-1">コピー</span>
                      </Button>
                      {(imageState?.finalUrl || imageState?.previewUrl) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = imageState.finalUrl || imageState.previewUrl;
                            if (url) {
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `${channelId}-post.png`;
                              a.click();
                            }
                          }}
                        >
                          <Download className="h-4 w-4" />
                          <span className="ml-1">DL</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Publish Checkbox */}
                  {channel?.supportsApiPost && (
                    <div className="flex items-center">
                      <Checkbox
                        id={`publish-${channelId}`}
                        checked={selectedForPublish.includes(channelId)}
                        onCheckedChange={() => togglePublishChannel(channelId)}
                        disabled={status === 'success'}
                      />
                      <Label
                        htmlFor={`publish-${channelId}`}
                        className="ml-2 text-sm"
                      >
                        投稿
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* API Publish Notice */}
      {selectedForPublish.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>投稿前の確認</AlertTitle>
          <AlertDescription>
            {selectedForPublish.length}件のチャネルに投稿します。
            投稿前に連携アカウントが設定されていることを確認してください。
            <Button variant="link" className="p-0 h-auto" asChild>
              <a href="/settings">
                <ExternalLink className="h-3 w-3 mr-1" />
                設定を確認
              </a>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={onBack} className="sm:mr-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>

        <Button variant="outline" onClick={downloadAll}>
          <Download className="mr-2 h-4 w-4" />
          すべてダウンロード
        </Button>

        <Button variant="outline" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          ライブラリに保存
        </Button>

        {selectedForPublish.length > 0 && (
          <Button
            onClick={handlePublish}
            disabled={isPublishing}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            {isPublishing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {selectedForPublish.length}件を投稿
          </Button>
        )}
      </div>
    </div>
  );
}

