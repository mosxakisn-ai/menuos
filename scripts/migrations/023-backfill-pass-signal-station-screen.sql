-- Assign legacy pass signals (stationScreenId IS NULL) to each venue's primary screen per station.

UPDATE "PassSignal" ps
SET "stationScreenId" = sub."id"
FROM (
  SELECT DISTINCT ON (s."venueId", s."station")
    s."id",
    s."venueId",
    s."station"
  FROM "VenueStationScreen" s
  ORDER BY s."venueId", s."station", s."sortOrder" ASC, s."createdAt" ASC
) sub
WHERE ps."stationScreenId" IS NULL
  AND ps."venueId" = sub."venueId"
  AND ps."station" = sub."station";
