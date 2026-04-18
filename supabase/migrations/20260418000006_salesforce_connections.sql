-- Salesforce OAuth token storage (one row per user)
CREATE TABLE IF NOT EXISTS salesforce_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_url text NOT NULL,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  connected_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE salesforce_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own SF connection"
  ON salesforce_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
