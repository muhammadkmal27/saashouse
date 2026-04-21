-- Menambah status 'is_read' untuk sistem notifikasi real-time
ALTER TABLE request_comments ADD COLUMN is_read BOOLEAN DEFAULT FALSE;

-- Index untuk carian pantas mesej yang belum dibaca
CREATE INDEX idx_comments_unread ON request_comments(request_id, is_read) WHERE is_read = FALSE;
