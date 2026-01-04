'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { CHANNEL_CONFIGS, type Channel } from '@/types';
import type { ComposerState } from '@/app/(dashboard)/compose/page';

interface ComposerStep2Props {
  state: ComposerState;
  updateState: (updates: Partial<ComposerState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ComposerStep2({ state, updateState, onNext, onBack }: ComposerStep2Props) {
  const toggleChannel = (channelId: Channel) => {
    const current = state.selectedChannels;
    const updated = current.includes(channelId)
      ? current.filter((c) => c !== channelId)
      : [...current, channelId];
    updateState({ selectedChannels: updated });
  };

  const canProceed = state.selectedChannels.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>投稿先チャネル</CardTitle>
          <CardDescription>
            投稿を生成するSNSプラットフォームを選択してください（複数選択可）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {CHANNEL_CONFIGS.map((channel) => {
              const isSelected = state.selectedChannels.includes(channel.id);
              return (
                <div
                  key={channel.id}
                  className={`relative flex items-start space-x-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => toggleChannel(channel.id)}
                >
                  <Checkbox
                    id={channel.id}
                    checked={isSelected}
                    onCheckedChange={() => toggleChannel(channel.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={channel.id}
                      className="font-medium cursor-pointer"
                    >
                      {channel.nameJa}
                    </Label>
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {channel.maxTextLength}文字
                      </Badge>
                      {channel.maxHashtags > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          #{channel.maxHashtags}個
                        </Badge>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {channel.aspectRatio}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {channel.supportsApiPost ? (
                        <span className="text-green-600">API投稿対応</span>
                      ) : (
                        <span className="text-amber-600">手動投稿（素材生成のみ）</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {state.selectedChannels.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">選択中のチャネル</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {state.selectedChannels.map((channelId) => {
                    const channel = CHANNEL_CONFIGS.find((c) => c.id === channelId);
                    return (
                      <Badge key={channelId} variant="default">
                        {channel?.nameJa}
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-violet-600">
                  {state.selectedChannels.length}
                </p>
                <p className="text-sm text-muted-foreground">チャネル</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          次へ：テキスト生成
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

