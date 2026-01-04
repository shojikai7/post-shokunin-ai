'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ArrowLeft, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { CHANNEL_CONFIGS, type Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import type { ComposerState } from '@/app/(dashboard)/compose/page';

interface ComposerStep3Props {
  state: ComposerState;
  updateState: (updates: Partial<ComposerState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ComposerStep3({ state, updateState, onNext, onBack }: ComposerStep3Props) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<Channel>(state.selectedChannels[0]);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateVariants = async () => {
    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/drafts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: state.profileId,
          inputText: state.inputText,
          eventInfo: state.eventInfo,
          language: state.language,
          channels: state.selectedChannels,
        }),
      });

      if (!response.ok) {
        throw new Error('生成に失敗しました');
      }

      const data = await response.json();
      updateState({
        draftId: data.draftId,
        variants: data.variants,
      });
    } catch {
      toast({
        title: 'エラー',
        description: '投稿文の生成に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (Object.keys(state.variants).length === 0) {
      generateVariants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: 'コピーしました',
      description: 'クリップボードにコピーしました',
    });
  };

  const updateVariant = (channel: Channel, field: 'postText' | 'hashtags' | 'rawPrompt', value: string | string[]) => {
    const currentVariant = state.variants[channel];
    if (!currentVariant) return;

    updateState({
      variants: {
        ...state.variants,
        [channel]: {
          ...currentVariant,
          [field]: value,
        },
      },
    });
  };

  const canProceed = Object.keys(state.variants).length > 0 && !isGenerating;

  return (
    <div className="space-y-6">
      {/* Generation Status */}
      {isGenerating && (
        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-violet-600 animate-pulse" />
            </div>
            <div>
              <p className="font-medium">投稿文を生成中...</p>
              <p className="text-sm text-muted-foreground">
                {state.selectedChannels.length}つのチャネル向けにコンテンツを最適化しています
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>生成結果</CardTitle>
              <CardDescription>各チャネル向けの投稿文を確認・編集できます</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={generateVariants}
              disabled={isGenerating}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
              再生成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Channel)}>
            <TabsList className="w-full justify-start overflow-x-auto">
              {state.selectedChannels.map((channelId) => {
                const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
                return (
                  <TabsTrigger key={channelId} value={channelId}>
                    {channel?.nameJa}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {state.selectedChannels.map((channelId) => {
              const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
              const variant = state.variants[channelId];

              return (
                <TabsContent key={channelId} value={channelId} className="space-y-4 mt-4">
                  {isGenerating || !variant ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : (
                    <>
                      {/* Post Text */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>投稿文</Label>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {variant.postText.length} / {channel?.maxTextLength}文字
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(variant.postText, `${channelId}-text`)}
                            >
                              {copiedField === `${channelId}-text` ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={variant.postText}
                          onChange={(e) => updateVariant(channelId, 'postText', e.target.value)}
                          rows={6}
                        />
                      </div>

                      {/* Hashtags */}
                      {channel?.maxHashtags && channel.maxHashtags > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>ハッシュタグ</Label>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">
                                {variant.hashtags.length} / {channel.maxHashtags}個
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(variant.hashtags.map(t => `#${t}`).join(' '), `${channelId}-tags`)}
                              >
                                {copiedField === `${channelId}-tags` ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {variant.hashtags.map((tag, index) => (
                              <Badge key={index} variant="outline">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Image Prompt */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>画像生成プロンプト</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(variant.rawPrompt, `${channelId}-prompt`)}
                          >
                            {copiedField === `${channelId}-prompt` ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={variant.rawPrompt}
                          onChange={(e) => updateVariant(channelId, 'rawPrompt', e.target.value)}
                          rows={4}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          このプロンプトを編集して、画像生成の内容を調整できます
                        </p>
                      </div>
                    </>
                  )}
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
          disabled={!canProceed}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          次へ：画像生成
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

