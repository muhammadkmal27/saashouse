-- Rule 15: Database Resource Management
-- Adding indexes to Foreign Keys to optimize SELECT queries and JOINs.

-- Projects
CREATE INDEX idx_projects_client_id ON projects(client_id);

-- Requests
CREATE INDEX idx_requests_project_id ON requests(project_id);
CREATE INDEX idx_requests_created_by ON requests(created_by);

-- Request Comments
CREATE INDEX idx_request_comments_request_id ON request_comments(request_id);
CREATE INDEX idx_request_comments_user_id ON request_comments(user_id);

-- Billings
CREATE INDEX idx_billings_project_id ON billings(project_id);

-- Subscriptions
CREATE INDEX idx_subscriptions_client_id ON subscriptions(client_id);
-- idx_subscriptions_project_id (if we add project_id column which was added in later migrations)
CREATE INDEX idx_subscriptions_project_id ON subscriptions(project_id);

-- Assets
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_uploader_id ON assets(uploader_id);

-- Notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
