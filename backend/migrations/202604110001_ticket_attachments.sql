-- Fasa 13: Tambah sokongan lampiran fail
ALTER TABLE requests ADD COLUMN attachment_urls TEXT[] DEFAULT '{}';
ALTER TABLE request_comments ADD COLUMN attachment_urls TEXT[] DEFAULT '{}';
