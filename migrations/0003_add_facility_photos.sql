-- Migration: Add facility_photos and photo_sync_logs tables
-- Version: 0003
-- Date: 2025-01-03

-- Facility Photos table - Google Places photos with full metadata
CREATE TABLE IF NOT EXISTS facility_photos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id VARCHAR NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'google_places', -- google_places, owner_upload, dshs, stock
  google_photo_reference TEXT,
  google_place_id TEXT,

  -- Storage
  storage_key TEXT,
  storage_url TEXT,
  original_url TEXT,

  -- Metadata
  width INTEGER,
  height INTEGER,
  content_hash TEXT,
  mime_type TEXT DEFAULT 'image/jpeg',
  file_size INTEGER,

  -- Attribution (required for Google Places)
  attribution_text TEXT,
  attribution_url TEXT,
  photographer_name TEXT,

  -- Display
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  caption TEXT,
  alt_text TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, active, failed, deleted
  error_message TEXT,

  -- Timestamps
  fetched_at TIMESTAMP,
  uploaded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for facility_photos
CREATE INDEX IF NOT EXISTS facility_photos_facility_idx ON facility_photos(facility_id);
CREATE INDEX IF NOT EXISTS facility_photos_source_idx ON facility_photos(source);
CREATE INDEX IF NOT EXISTS facility_photos_status_idx ON facility_photos(status);
CREATE INDEX IF NOT EXISTS facility_photos_hash_idx ON facility_photos(content_hash);
CREATE INDEX IF NOT EXISTS facility_photos_primary_idx ON facility_photos(facility_id, is_primary);

-- Photo Sync Logs - track sync operations
CREATE TABLE IF NOT EXISTS photo_sync_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scope
  facility_id VARCHAR,
  batch_id TEXT,

  -- Operation details
  operation TEXT NOT NULL, -- find_place, fetch_photos, download_photo, upload_to_storage, batch_start, batch_complete
  status TEXT NOT NULL DEFAULT 'started', -- started, success, failed, skipped

  -- Results
  items_processed INTEGER DEFAULT 0,
  items_succeeded INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,

  -- Error tracking
  error_message TEXT,
  error_details JSONB,

  -- Performance
  duration_ms INTEGER,
  api_calls_used INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Indexes for photo_sync_logs
CREATE INDEX IF NOT EXISTS photo_sync_logs_facility_idx ON photo_sync_logs(facility_id);
CREATE INDEX IF NOT EXISTS photo_sync_logs_batch_idx ON photo_sync_logs(batch_id);
CREATE INDEX IF NOT EXISTS photo_sync_logs_operation_idx ON photo_sync_logs(operation);
CREATE INDEX IF NOT EXISTS photo_sync_logs_status_idx ON photo_sync_logs(status);

-- Add trigger for updated_at on facility_photos
CREATE OR REPLACE FUNCTION update_facility_photos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS facility_photos_updated_at ON facility_photos;
CREATE TRIGGER facility_photos_updated_at
  BEFORE UPDATE ON facility_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_facility_photos_updated_at();
