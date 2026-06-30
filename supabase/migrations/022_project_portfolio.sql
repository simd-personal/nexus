-- Work vs personal project portfolios and dashboard scope preference

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS portfolio TEXT NOT NULL DEFAULT 'work'
    CHECK (portfolio IN ('work', 'personal'));

CREATE INDEX IF NOT EXISTS idx_projects_portfolio ON projects(portfolio);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS dashboard_portfolio TEXT NOT NULL DEFAULT 'work'
    CHECK (dashboard_portfolio IN ('work', 'personal', 'all'));
