'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ComposerStep1 } from '@/components/composer/step1-input';
import { ComposerStep2 } from '@/components/composer/step2-channels';
import { ComposerStep3 } from '@/components/composer/step3-results';
import { ComposerStep4 } from '@/components/composer/step4-images';
import { ComposerStep5 } from '@/components/composer/step5-publish';
import { Progress } from '@/components/ui/progress';
import type { Channel } from '@/types';

export interface ComposerState {
  step: number;
  profileId: string | null;
  inputText: string;
  eventInfo: {
    title: string;
    startDate: string;
    endDate: string;
    description: string;
  } | null;
  language: 'ja' | 'en';
  selectedChannels: Channel[];
  draftId: string | null;
  variants: Record<string, {
    id: string;
    postText: string;
    hashtags: string[];
    rawPrompt: string;
    structuredPrompt: string;
  }>;
  generatedImages: Record<string, {
    previewUrl?: string;
    finalUrl?: string;
    jobId?: string;
    status: 'idle' | 'generating' | 'done' | 'error';
  }>;
}

const STEPS = [
  { label: '入力', description: '投稿内容を入力' },
  { label: 'チャネル', description: '投稿先を選択' },
  { label: 'テキスト', description: '投稿文を確認' },
  { label: '画像', description: '画像を生成' },
  { label: '投稿', description: '投稿/エクスポート' },
];

export default function ComposePage() {
  const searchParams = useSearchParams();
  const initialProfileId = searchParams.get('profile');

  const [state, setState] = useState<ComposerState>({
    step: 1,
    profileId: initialProfileId,
    inputText: '',
    eventInfo: null,
    language: 'ja',
    selectedChannels: [],
    draftId: null,
    variants: {},
    generatedImages: {},
  });

  const progress = (state.step / STEPS.length) * 100;

  const handleNext = () => {
    setState(prev => ({ ...prev, step: Math.min(prev.step + 1, STEPS.length) }));
  };

  const handleBack = () => {
    setState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));
  };

  const updateState = (updates: Partial<ComposerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">投稿を作成</h1>
        <p className="text-muted-foreground mt-1">
          1回の入力で複数のSNS向けコンテンツを生成します
        </p>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          {STEPS.map((step, index) => (
            <div
              key={step.label}
              className={`flex-1 text-center ${
                index + 1 <= state.step ? 'text-violet-600 font-medium' : 'text-muted-foreground'
              }`}
            >
              <span className="hidden sm:inline">{step.label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Content */}
      <div className="mt-8">
        {state.step === 1 && (
          <ComposerStep1
            state={state}
            updateState={updateState}
            onNext={handleNext}
          />
        )}
        {state.step === 2 && (
          <ComposerStep2
            state={state}
            updateState={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {state.step === 3 && (
          <ComposerStep3
            state={state}
            updateState={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {state.step === 4 && (
          <ComposerStep4
            state={state}
            updateState={updateState}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}
        {state.step === 5 && (
          <ComposerStep5
            state={state}
            updateState={updateState}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}

