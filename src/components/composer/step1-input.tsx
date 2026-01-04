'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowRight, Calendar, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { ComposerState } from '@/app/(dashboard)/compose/page';

interface ComposerStep1Props {
  state: ComposerState;
  updateState: (updates: Partial<ComposerState>) => void;
  onNext: () => void;
}

interface Profile {
  id: string;
  brand_name: string;
}

export function ComposerStep1({ state, updateState, onNext }: ComposerStep1Props) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isEventMode, setIsEventMode] = useState(!!state.eventInfo);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('id, brand_name')
        .order('created_at', { ascending: false });
      
      setProfiles(data ?? []);
      setIsLoading(false);
    };
    fetchProfiles();
  }, []);

  const canProceed = state.profileId && state.inputText.trim().length > 0;

  return (
    <div className="space-y-6">
      {/* Profile Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            プロファイル選択
          </CardTitle>
          <CardDescription>どのブランドの投稿を作成しますか？</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-10 bg-slate-100 animate-pulse rounded-md" />
          ) : profiles.length > 0 ? (
            <Select
              value={state.profileId ?? ''}
              onValueChange={(value) => updateState({ profileId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="プロファイルを選択" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.brand_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">
              プロファイルがありません。先にプロファイルを作成してください。
            </p>
          )}
        </CardContent>
      </Card>

      {/* Input Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>投稿タイプ</CardTitle>
          <CardDescription>通常投稿かイベント告知かを選択</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Switch
              id="event-mode"
              checked={isEventMode}
              onCheckedChange={(checked) => {
                setIsEventMode(checked);
                if (!checked) {
                  updateState({ eventInfo: null });
                } else {
                  updateState({
                    eventInfo: { title: '', startDate: '', endDate: '', description: '' },
                  });
                }
              }}
            />
            <Label htmlFor="event-mode" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              イベント/キャンペーン告知モード
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Input Content */}
      <Card>
        <CardHeader>
          <CardTitle>投稿内容</CardTitle>
          <CardDescription>
            {isEventMode
              ? 'イベント情報を入力してください'
              : '投稿したい内容を簡潔に入力してください'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEventMode ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="event-title">イベント名 *</Label>
                <Input
                  id="event-title"
                  value={state.eventInfo?.title ?? ''}
                  onChange={(e) =>
                    updateState({
                      eventInfo: { ...state.eventInfo!, title: e.target.value },
                    })
                  }
                  placeholder="例: 夏のスペシャルセール"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="event-start">開始日</Label>
                  <Input
                    id="event-start"
                    type="date"
                    value={state.eventInfo?.startDate ?? ''}
                    onChange={(e) =>
                      updateState({
                        eventInfo: { ...state.eventInfo!, startDate: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event-end">終了日</Label>
                  <Input
                    id="event-end"
                    type="date"
                    value={state.eventInfo?.endDate ?? ''}
                    onChange={(e) =>
                      updateState({
                        eventInfo: { ...state.eventInfo!, endDate: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-description">詳細説明</Label>
                <Textarea
                  id="event-description"
                  value={state.eventInfo?.description ?? ''}
                  onChange={(e) =>
                    updateState({
                      eventInfo: { ...state.eventInfo!, description: e.target.value },
                    })
                  }
                  placeholder="イベントの詳細や特典など"
                  rows={3}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="input-text">
              {isEventMode ? '追加メッセージ' : '投稿内容'} *
            </Label>
            <Textarea
              id="input-text"
              value={state.inputText}
              onChange={(e) => updateState({ inputText: e.target.value })}
              placeholder={
                isEventMode
                  ? '例: 今だけの特別価格でご提供！'
                  : '例: 新メニュー登場！季節限定のマンゴーパフェ'
              }
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              AIがこの内容を元に各SNS向けの投稿文を生成します
            </p>
          </div>

          <div className="space-y-2">
            <Label>投稿言語</Label>
            <RadioGroup
              value={state.language}
              onValueChange={(value) => updateState({ language: value as 'ja' | 'en' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ja" id="lang-ja" />
                <Label htmlFor="lang-ja" className="font-normal">日本語</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="lang-en" />
                <Label htmlFor="lang-en" className="font-normal">English</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          次へ：チャネル選択
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

