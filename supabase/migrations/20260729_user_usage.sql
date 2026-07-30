CREATE TABLE user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  chat_count INT DEFAULT 0,
  quiz_count INT DEFAULT 0,
  voice_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON user_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_user_usage_user_id ON user_usage(user_id);

CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_column TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  EXECUTE format(
    'INSERT INTO user_usage (user_id, %I) VALUES ($1, 1)
     ON CONFLICT (user_id) DO UPDATE SET %I = user_usage.%I + 1, updated_at = NOW()',
    p_column, p_column, p_column
  ) USING p_user_id;
END;
$$;
