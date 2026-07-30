CREATE TABLE IF NOT EXISTS beta_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE beta_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON beta_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
