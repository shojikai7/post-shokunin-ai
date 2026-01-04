import { ProfileForm } from '@/components/profile/profile-form';

export default function NewProfilePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">新規プロファイル作成</h1>
        <p className="text-muted-foreground mt-1">
          ブランド情報とトーン設定を登録します
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}

