import { notFound } from 'next/navigation';
import { getProfile } from '@/lib/profiles/actions';
import { ProfileForm } from '@/components/profile/profile-form';

interface EditProfilePageProps {
  params: { id: string };
}

export default async function EditProfilePage({ params }: EditProfilePageProps) {
  const profile = await getProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">プロファイル編集</h1>
        <p className="text-muted-foreground mt-1">
          {profile.brand_name} の設定を編集します
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}

