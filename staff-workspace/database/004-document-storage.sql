-- Additive provider routing. Existing documents remain private Vercel Blob files.
ALTER TABLE workspace_document
  ADD COLUMN storage_provider text NOT NULL DEFAULT 'blob',
  ADD COLUMN storage_site_id text,
  ADD COLUMN storage_drive_id text,
  ADD CONSTRAINT workspace_document_storage CHECK (
    (storage_provider='blob' AND storage_site_id IS NULL AND storage_drive_id IS NULL)
    OR (storage_provider='sharepoint'
      AND storage_site_id IS NOT NULL AND storage_drive_id IS NOT NULL
      AND storage_site_id='jdpcmaiduguri.sharepoint.com,99a6f3e6-3794-4c52-b0bd-73544629ae8b,a1929eca-f3f4-4a83-9bba-6614357270df'
      AND storage_drive_id='b!5vOmmZQ3UkywvXNURimui8qekqH084NKm7pmFDVycN8j35ZBxpkzQ5ErrkOhn1tf')
  );
