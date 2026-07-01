-- Optional table-zone filter per department screen (e.g. «Αυλή» → only Αυλή-* tables)

ALTER TABLE "VenueStationScreen" ADD COLUMN IF NOT EXISTS "spotPrefix" VARCHAR(20);
