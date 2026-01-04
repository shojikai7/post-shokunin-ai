'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, Image, RefreshCw, Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { CHANNEL_CONFIGS, MEDIA_SIZES, type Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { ComposerState } from '@/app/(dashboard)/compose/page';

interface ComposerStep4Props {
  state: ComposerState;
  updateState: (updates: Partial<ComposerState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ComposerStep4({ state, updateState, onNext, onBack }: ComposerStep4Props) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Channel>(state.selectedChannels[0]);

  const generatePreview = async (channel: Channel) => {
    const variant = state.variants[channel];
    if (!variant) return;

    // Update status to generating
    updateState({
      generatedImages: {
        ...state.generatedImages,
        [channel]: { status: 'generating' },
      },
    });

    try {
      const response = await fetch('/api/images/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
          prompt: variant.rawPrompt,
          channel,
        }),
      });

      if (!response.ok) {
        throw new Error('プレビュー生成に失敗しました');
      }

      const data = await response.json();
      
      updateState({
        generatedImages: {
          ...state.generatedImages,
          [channel]: {
            previewUrl: data.previewUrl,
            jobId: data.jobId,
            status: 'done',
          },
        },
      });
    } catch {
      updateState({
        generatedImages: {
          ...state.generatedImages,
          [channel]: { status: 'error' },
        },
      });
      toast({
        title: 'エラー',
        description: 'プレビュー生成に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const generateFinal = async (channel: Channel) => {
    const variant = state.variants[channel];
    if (!variant) return;

    updateState({
      generatedImages: {
        ...state.generatedImages,
        [channel]: {
          ...state.generatedImages[channel],
          status: 'generating',
        },
      },
    });

    try {
      const response = await fetch('/api/images/final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: variant.id,
          prompt: variant.rawPrompt,
          channel,
        }),
      });

      if (!response.ok) {
        throw new Error('本生成に失敗しました');
      }

      const data = await response.json();
      
      updateState({
        generatedImages: {
          ...state.generatedImages,
          [channel]: {
            ...state.generatedImages[channel],
            finalUrl: data.finalUrl,
            status: 'done',
          },
        },
      });

      toast({
        title: '生成完了',
        description: `${CHANNEL_CONFIGS.find(c => c.id === channel)?.nameJa}の画像が生成されました`,
      });
    } catch {
      updateState({
        generatedImages: {
          ...state.generatedImages,
          [channel]: {
            ...state.generatedImages[channel],
            status: 'error',
          },
        },
      });
      toast({
        title: 'エラー',
        description: '本生成に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const generateAllPreviews = async () => {
    for (const channel of state.selectedChannels) {
      await generatePreview(channel);
    }
  };

  return (
    <div className="space-y-6">
      {/* Generate All Button */}
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50">
        <CardContent className="flex items-center justify-between py-6">
          <div>
            <p className="font-medium">一括プレビュー生成</p>
            <p className="text-sm text-muted-foreground">
              選択した{state.selectedChannels.length}つのチャネルすべてのプレビューを生成
            </p>
          </div>
          <Button
            onClick={generateAllPreviews}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            すべてプレビュー生成
          </Button>
        </CardContent>
      </Card>

      {/* Image Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>画像生成</CardTitle>
          <CardDescription>
            各チャネル向けの画像を生成します。プレビューで確認後、本生成を実行してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Channel)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {state.selectedChannels.map((channelId) => {
                const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
                const imageState = state.generatedImages[channelId];
                return (
                  <TabsTrigger key={channelId} value={channelId} className="gap-2">
                    {channel?.nameJa}
                    {imageState?.finalUrl && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {state.selectedChannels.map((channelId) => {
              const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
              const mediaSize = MEDIA_SIZES.find((m) => m.channel === channelId);
              const imageState = state.generatedImages[channelId];
              const variant = state.variants[channelId];

              return (
                <TabsContent key={channelId} value={channelId} className="mt-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Image Preview */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">プレビュー</h4>
                        <Badge variant="secondary">
                          {mediaSize?.width} x {mediaSize?.height}
                        </Badge>
                      </div>
                      
                      <div
                        className="relative bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center"
                        style={{
                          aspectRatio: channel?.aspectRatio?.replace(':', '/') || '1/1',
                        }}
                      >
                        {imageState?.status === 'generating' ? (
                          <div className="text-center">
                            <RefreshCw className="h-8 w-8 text-violet-500 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">生成中...</p>
                          </div>
                        ) : imageState?.previewUrl || imageState?.finalUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imageState.finalUrl || imageState.previewUrl}
                            alt="生成されたプレビュー画像"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-8">
                            <Image className="h-12 w-12 text-slate-300 mx-auto mb-2" aria-hidden="true" />
                            <p className="text-sm text-muted-foreground">
                              画像がまだ生成されていません
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => generatePreview(channelId)}
                          disabled={imageState?.status === 'generating'}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          プレビュー生成
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => generateFinal(channelId)}
                          disabled={
                            !imageState?.previewUrl ||
                            imageState?.status === 'generating'
                          }
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          本生成
                        </Button>
                      </div>

                      {imageState?.finalUrl && (
                        <Button variant="outline" className="w-full">
                          <Download className="mr-2 h-4 w-4" />
                          ダウンロード
                        </Button>
                      )}
                    </div>

                    {/* Prompt Info */}
                    <div className="space-y-4">
                      <h4 className="font-medium">生成プロンプト</h4>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-mono whitespace-pre-wrap">
                          {variant?.rawPrompt || 'プロンプトが設定されていません'}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium">チャネル設定</h5>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            アスペクト比: {channel?.aspectRatio}
                          </Badge>
                          <Badge variant="outline">
                            {mediaSize?.width} x {mediaSize?.height}px
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          戻る
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          次へ：投稿/エクスポート
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

