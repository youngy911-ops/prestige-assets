-- Add description column for GPT-4o generated asset descriptions
-- Nullable: null means description has not been generated yet (triggers generation on output page load)
-- Cleared to null by saveReview when staff re-review and update fields (prevents stale descriptions)
ALTER TABLE assets ADD COLUMN description text;
