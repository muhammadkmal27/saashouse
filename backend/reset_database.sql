-- ==========================================
-- Database Reset Script for SaaS House
-- Purpose: Clear all data except Admin accounts
-- ==========================================

-- 1. Clear transactional and project-related tables
-- TRUNCATE with CASCADE handles all dependent rows in order.
TRUNCATE TABLE 
    notifications, 
    request_comments, 
    requests, 
    billings, 
    subscriptions, 
    assets, 
    projects,
    processed_webhooks,
    security_events,
    otps
CASCADE;

-- 2. Delete all non-admin users
-- Note: user_profiles and user_preferences will be deleted automatically 
-- due to ON DELETE CASCADE on the user_id foreign key.
DELETE FROM users WHERE role != 'ADMIN';

-- 3. Final Check
SELECT 'Database reset successful. Admins remaining: ' || count(*) FROM users WHERE role = 'ADMIN';
