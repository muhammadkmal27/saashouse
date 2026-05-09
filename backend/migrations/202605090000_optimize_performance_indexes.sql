-- Performance Optimization: Indexing for High Traffic (10,000 Concurrent Users)
-- Rule 15: Database Resource Management
-- Focus: Speeding up Dashboard Filters and Status lookups.

-- Projects: Faster filtering by status (Draft, Live, etc)
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Requests: Faster filtering by ticket status (Open, In Progress, etc)
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);

-- Billings: Faster filtering for unpaid/paid invoices
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(status);

-- Notifications: Extremely fast lookup for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read) WHERE is_read = FALSE;

-- Users: Fast lookup for active users
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;
