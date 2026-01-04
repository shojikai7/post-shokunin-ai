-- ========================================
-- Post Shokunin AI - Initial Schema
-- ========================================

-- pgcrypto is already enabled in Supabase by default
-- gen_random_uuid() is available

-- ========================================
-- Enums
-- ========================================

CREATE TYPE channel_type AS ENUM ('x', 'instagram', 'tiktok', 'gbp', 'note');
CREATE TYPE job_type AS ENUM ('preview', 'final');
CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
CREATE TYPE asset_type AS ENUM ('logo', 'product_photo', 'store_photo', 'font', 'template');
CREATE TYPE publish_provider AS ENUM ('x', 'meta', 'tiktok', 'google');
CREATE TYPE publish_status AS ENUM ('pending', 'succeeded', 'failed');
CREATE TYPE gbp_post_type AS ENUM ('STANDARD', 'EVENT', 'OFFER');

-- ========================================
-- Profiles Table
-- ========================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    description_short TEXT NOT NULL DEFAULT '',
    description_long TEXT NOT NULL DEFAULT '',
    target_audience TEXT NOT NULL DEFAULT '',
    strengths TEXT NOT NULL DEFAULT '',
    prohibited_expressions TEXT[] NOT NULL DEFAULT '{}',
    campaign_info JSONB,
    reference_urls TEXT[] NOT NULL DEFAULT '{}',
    tone_settings JSONB NOT NULL DEFAULT '{
        "formality": "formal",
        "emojiUsage": "moderate",
        "endingStyle": "",
        "hardness": 3,
        "ctaStrength": 3,
        "ngWords": [],
        "replacements": []
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ========================================
-- Brand Assets Table
-- ========================================

CREATE TABLE brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type asset_type NOT NULL,
    storage_path TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_brand_assets_profile_id ON brand_assets(profile_id);

-- ========================================
-- Drafts Table
-- ========================================

CREATE TABLE drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    event_info JSONB,
    language TEXT NOT NULL DEFAULT 'ja' CHECK (language IN ('ja', 'en')),
    selected_channels channel_type[] NOT NULL DEFAULT '{}',
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_drafts_profile_id ON drafts(profile_id);
CREATE INDEX idx_drafts_is_saved ON drafts(is_saved);

-- ========================================
-- Channel Variants Table
-- ========================================

CREATE TABLE channel_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    draft_id UUID NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
    channel channel_type NOT NULL,
    post_text TEXT NOT NULL DEFAULT '',
    hashtags TEXT[] NOT NULL DEFAULT '{}',
    image_spec JSONB NOT NULL DEFAULT '{}',
    raw_prompt TEXT NOT NULL DEFAULT '',
    structured_prompt TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(draft_id, channel)
);

CREATE INDEX idx_channel_variants_draft_id ON channel_variants(draft_id);

-- ========================================
-- Generation Jobs Table
-- ========================================

CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES channel_variants(id) ON DELETE CASCADE,
    type job_type NOT NULL,
    status job_status NOT NULL DEFAULT 'queued',
    idempotency_key TEXT NOT NULL UNIQUE,
    error_code TEXT,
    error_detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_generation_jobs_variant_id ON generation_jobs(variant_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);

-- ========================================
-- Output Assets Table
-- ========================================

CREATE TABLE output_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES channel_variants(id) ON DELETE CASCADE,
    kind job_type NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('png', 'jpeg', 'webp')),
    storage_path TEXT NOT NULL,
    public_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_output_assets_variant_id ON output_assets(variant_id);

-- ========================================
-- Publish Connections Table
-- ========================================

CREATE TABLE publish_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider publish_provider NOT NULL,
    encrypted_tokens TEXT NOT NULL,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    account_name TEXT,
    account_id TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_publish_connections_user_id ON publish_connections(user_id);

-- ========================================
-- Publish Attempts Table
-- ========================================

CREATE TABLE publish_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES channel_variants(id) ON DELETE CASCADE,
    provider publish_provider NOT NULL,
    status publish_status NOT NULL DEFAULT 'pending',
    response JSONB,
    error_code TEXT,
    error_detail TEXT,
    post_id TEXT, -- External post ID from the platform
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_publish_attempts_variant_id ON publish_attempts(variant_id);

-- ========================================
-- Audit Logs Table
-- ========================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ========================================
-- Usage Tracking Table (for billing)
-- ========================================

CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- Format: YYYY-MM
    generation_count INTEGER NOT NULL DEFAULT 0,
    publish_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month)
);

CREATE INDEX idx_usage_records_user_id_month ON usage_records(user_id, month);

-- ========================================
-- Row Level Security (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE output_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE publish_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profiles"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profiles"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
    ON profiles FOR DELETE
    USING (auth.uid() = user_id);

-- Brand Assets policies
CREATE POLICY "Users can view their own brand assets"
    ON brand_assets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = brand_assets.profile_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own brand assets"
    ON brand_assets FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = brand_assets.profile_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own brand assets"
    ON brand_assets FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = brand_assets.profile_id AND profiles.user_id = auth.uid()
    ));

-- Drafts policies
CREATE POLICY "Users can view their own drafts"
    ON drafts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = drafts.profile_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own drafts"
    ON drafts FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = drafts.profile_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own drafts"
    ON drafts FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = drafts.profile_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can delete their own drafts"
    ON drafts FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE profiles.id = drafts.profile_id AND profiles.user_id = auth.uid()
    ));

-- Channel Variants policies
CREATE POLICY "Users can view their own variants"
    ON channel_variants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM drafts 
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE drafts.id = channel_variants.draft_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their own variants"
    ON channel_variants FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM drafts 
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE drafts.id = channel_variants.draft_id AND profiles.user_id = auth.uid()
    ));

CREATE POLICY "Users can update their own variants"
    ON channel_variants FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM drafts 
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE drafts.id = channel_variants.draft_id AND profiles.user_id = auth.uid()
    ));

-- Generation Jobs policies
CREATE POLICY "Users can view their own jobs"
    ON generation_jobs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM channel_variants 
        JOIN drafts ON drafts.id = channel_variants.draft_id
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE channel_variants.id = generation_jobs.variant_id AND profiles.user_id = auth.uid()
    ));

-- Output Assets policies
CREATE POLICY "Users can view their own output assets"
    ON output_assets FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM channel_variants 
        JOIN drafts ON drafts.id = channel_variants.draft_id
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE channel_variants.id = output_assets.variant_id AND profiles.user_id = auth.uid()
    ));

-- Publish Connections policies
CREATE POLICY "Users can view their own connections"
    ON publish_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connections"
    ON publish_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
    ON publish_connections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
    ON publish_connections FOR DELETE
    USING (auth.uid() = user_id);

-- Publish Attempts policies
CREATE POLICY "Users can view their own publish attempts"
    ON publish_attempts FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM channel_variants 
        JOIN drafts ON drafts.id = channel_variants.draft_id
        JOIN profiles ON profiles.id = drafts.profile_id 
        WHERE channel_variants.id = publish_attempts.variant_id AND profiles.user_id = auth.uid()
    ));

-- Audit Logs policies
CREATE POLICY "Users can view their own audit logs"
    ON audit_logs FOR SELECT
    USING (auth.uid() = user_id);

-- Usage Records policies
CREATE POLICY "Users can view their own usage"
    ON usage_records FOR SELECT
    USING (auth.uid() = user_id);

-- ========================================
-- Functions
-- ========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channel_variants_updated_at
    BEFORE UPDATE ON channel_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_jobs_updated_at
    BEFORE UPDATE ON generation_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_publish_connections_updated_at
    BEFORE UPDATE ON publish_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_records_updated_at
    BEFORE UPDATE ON usage_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Increment usage count function
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_type TEXT)
RETURNS void AS $$
DECLARE
    current_month TEXT := to_char(NOW(), 'YYYY-MM');
BEGIN
    INSERT INTO usage_records (user_id, month, generation_count, publish_count)
    VALUES (p_user_id, current_month, 
        CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
        CASE WHEN p_type = 'publish' THEN 1 ELSE 0 END
    )
    ON CONFLICT (user_id, month) 
    DO UPDATE SET
        generation_count = usage_records.generation_count + CASE WHEN p_type = 'generation' THEN 1 ELSE 0 END,
        publish_count = usage_records.publish_count + CASE WHEN p_type = 'publish' THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

