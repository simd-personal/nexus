-- Sales quote requests for organization / enterprise tenants (not self-serve signup)

CREATE TABLE organization_quote_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'other'
    CHECK (industry IN ('software', 'healthcare', 'other')),
  team_size TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_quote_requests_status ON organization_quote_requests(status, created_at DESC);

ALTER TABLE organization_quote_requests ENABLE ROW LEVEL SECURITY;

-- No public SELECT; inserts happen via service role in server actions only
