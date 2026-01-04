import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const draftId = params.id;

    // Verify ownership through profile
    const { data: draft } = await supabase
      .from('drafts')
      .select('*, profiles!inner(*)')
      .eq('id', draftId)
      .eq('profiles.user_id', user.id)
      .single();

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Update draft to saved
    const { error } = await supabase
      .from('drafts')
      .update({ is_saved: true })
      .eq('id', draftId);

    if (error) {
      return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

