ALTER TABLE files ADD COLUMN IF NOT EXISTS storage_path TEXT;

CREATE INDEX IF NOT EXISTS idx_files_storage_path ON files(storage_path);

