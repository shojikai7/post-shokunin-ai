'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createProfile, updateProfile } from '@/lib/profiles/actions';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ProfileFormProps {
  profile?: {
    id: string;
    brand_name: string;
    description_short: string;
    description_long: string;
    target_audience: string;
    strengths: string;
    prohibited_expressions: string[];
    campaign_info: {
      name?: string;
      startDate?: string;
      endDate?: string;
      price?: string;
      benefits?: string;
    } | null;
    reference_urls: string[];
    tone_settings: {
      formality: 'formal' | 'casual';
      emojiUsage: 'none' | 'moderate' | 'heavy';
      endingStyle: string;
      hardness: number;
      ctaStrength: number;
      ngWords: string[];
    };
  };
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    brandName: profile?.brand_name ?? '',
    descriptionShort: profile?.description_short ?? '',
    descriptionLong: profile?.description_long ?? '',
    targetAudience: profile?.target_audience ?? '',
    strengths: profile?.strengths ?? '',
    prohibitedExpressions: profile?.prohibited_expressions?.join('\n') ?? '',
    campaignName: profile?.campaign_info?.name ?? '',
    campaignStartDate: profile?.campaign_info?.startDate ?? '',
    campaignEndDate: profile?.campaign_info?.endDate ?? '',
    campaignPrice: profile?.campaign_info?.price ?? '',
    campaignBenefits: profile?.campaign_info?.benefits ?? '',
    referenceUrls: profile?.reference_urls?.join('\n') ?? '',
    toneFormality: profile?.tone_settings?.formality ?? 'formal',
    toneEmojiUsage: profile?.tone_settings?.emojiUsage ?? 'moderate',
    toneEndingStyle: profile?.tone_settings?.endingStyle ?? '',
    toneHardness: profile?.tone_settings?.hardness ?? 3,
    toneCtaStrength: profile?.tone_settings?.ctaStrength ?? 3,
    ngWords: profile?.tone_settings?.ngWords?.join('\n') ?? '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = profile
        ? await updateProfile(profile.id, formData as never)
        : await createProfile(formData as never);

      if (result?.error) {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本情報</CardTitle>
          <CardDescription>ブランドの基本的な情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">ブランド名 *</Label>
            <Input
              id="brandName"
              value={formData.brandName}
              onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              placeholder="例: 〇〇カフェ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionShort">サービス説明（短） *</Label>
            <Input
              id="descriptionShort"
              value={formData.descriptionShort}
              onChange={(e) => setFormData({ ...formData, descriptionShort: e.target.value })}
              placeholder="例: 地元の食材を使った手作りスイーツのカフェ"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descriptionLong">サービス説明（詳細）</Label>
            <Textarea
              id="descriptionLong"
              value={formData.descriptionLong}
              onChange={(e) => setFormData({ ...formData, descriptionLong: e.target.value })}
              placeholder="より詳しいサービス説明を入力してください"
              rows={4}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetAudience">ターゲット</Label>
              <Input
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="例: 20〜40代女性、健康志向"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strengths">強み・特徴</Label>
              <Input
                id="strengths"
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="例: 無添加、オーガニック素材"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referenceUrls">参考URL（1行に1つ）</Label>
            <Textarea
              id="referenceUrls"
              value={formData.referenceUrls}
              onChange={(e) => setFormData({ ...formData, referenceUrls: e.target.value })}
              placeholder="https://example.com"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle>キャンペーン情報</CardTitle>
          <CardDescription>現在実施中のキャンペーンがあれば入力してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">キャンペーン名</Label>
            <Input
              id="campaignName"
              value={formData.campaignName}
              onChange={(e) => setFormData({ ...formData, campaignName: e.target.value })}
              placeholder="例: 夏のスペシャルセール"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignStartDate">開始日</Label>
              <Input
                id="campaignStartDate"
                type="date"
                value={formData.campaignStartDate}
                onChange={(e) => setFormData({ ...formData, campaignStartDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignEndDate">終了日</Label>
              <Input
                id="campaignEndDate"
                type="date"
                value={formData.campaignEndDate}
                onChange={(e) => setFormData({ ...formData, campaignEndDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="campaignPrice">価格・割引</Label>
              <Input
                id="campaignPrice"
                value={formData.campaignPrice}
                onChange={(e) => setFormData({ ...formData, campaignPrice: e.target.value })}
                placeholder="例: 20%オフ"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="campaignBenefits">特典</Label>
              <Input
                id="campaignBenefits"
                value={formData.campaignBenefits}
                onChange={(e) => setFormData({ ...formData, campaignBenefits: e.target.value })}
                placeholder="例: ドリンク1杯無料"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tone Settings */}
      <Card>
        <CardHeader>
          <CardTitle>トーン設定</CardTitle>
          <CardDescription>投稿文の雰囲気を設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>文体</Label>
            <RadioGroup
              value={formData.toneFormality}
              onValueChange={(value) => setFormData({ ...formData, toneFormality: value as 'formal' | 'casual' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" />
                <Label htmlFor="formal" className="font-normal">敬体（です・ます調）</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="casual" id="casual" />
                <Label htmlFor="casual" className="font-normal">常体（だ・である調）</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>絵文字の使用</Label>
            <RadioGroup
              value={formData.toneEmojiUsage}
              onValueChange={(value) => setFormData({ ...formData, toneEmojiUsage: value as 'none' | 'moderate' | 'heavy' })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="emoji-none" />
                <Label htmlFor="emoji-none" className="font-normal">なし</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="moderate" id="emoji-moderate" />
                <Label htmlFor="emoji-moderate" className="font-normal">適度に</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="heavy" id="emoji-heavy" />
                <Label htmlFor="emoji-heavy" className="font-normal">積極的に</Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="toneEndingStyle">語尾スタイル</Label>
            <Input
              id="toneEndingStyle"
              value={formData.toneEndingStyle}
              onChange={(e) => setFormData({ ...formData, toneEndingStyle: e.target.value })}
              placeholder="例: 〜だよ、〜ね、〜！"
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>トーンの硬さ</Label>
              <span className="text-sm text-muted-foreground">
                {['とても柔らかい', 'やや柔らかい', '標準', 'やや硬め', 'フォーマル'][formData.toneHardness - 1]}
              </span>
            </div>
            <Slider
              value={[formData.toneHardness]}
              onValueChange={(value) => setFormData({ ...formData, toneHardness: value[0] })}
              min={1}
              max={5}
              step={1}
            />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>CTAの強さ</Label>
              <span className="text-sm text-muted-foreground">
                {['控えめ', 'やや控えめ', '標準', 'やや強め', '積極的'][formData.toneCtaStrength - 1]}
              </span>
            </div>
            <Slider
              value={[formData.toneCtaStrength]}
              onValueChange={(value) => setFormData({ ...formData, toneCtaStrength: value[0] })}
              min={1}
              max={5}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      {/* Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle>禁止表現・NGワード</CardTitle>
          <CardDescription>投稿に含めたくない表現を設定してください</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prohibitedExpressions">禁止表現（1行に1つ）</Label>
            <Textarea
              id="prohibitedExpressions"
              value={formData.prohibitedExpressions}
              onChange={(e) => setFormData({ ...formData, prohibitedExpressions: e.target.value })}
              placeholder="例:&#10;激安&#10;最安値"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngWords">NGワード（1行に1つ）</Label>
            <Textarea
              id="ngWords"
              value={formData.ngWords}
              onChange={(e) => setFormData({ ...formData, ngWords: e.target.value })}
              placeholder="生成時に除外する単語"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" type="button" asChild>
          <Link href="/profiles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            戻る
          </Link>
        </Button>
        <Button 
          type="submit" 
          disabled={isPending}
          className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              保存中...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {profile ? '更新' : '作成'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

