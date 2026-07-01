-- Multiple department screens per venue (e.g. two bars: beach + main)

CREATE TABLE IF NOT EXISTS "VenueStationScreen" (
  "id" TEXT NOT NULL,
  "venueId" TEXT NOT NULL,
  "station" "PassStation" NOT NULL,
  "label" VARCHAR(40) NOT NULL,
  "screenToken" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VenueStationScreen_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VenueStationScreen_screenToken_key" ON "VenueStationScreen" ("screenToken");
CREATE INDEX IF NOT EXISTS "VenueStationScreen_venueId_station_sortOrder_idx"
  ON "VenueStationScreen" ("venueId", "station", "sortOrder");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'VenueStationScreen_venueId_fkey'
  ) THEN
    ALTER TABLE "VenueStationScreen"
      ADD CONSTRAINT "VenueStationScreen_venueId_fkey"
      FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "PassSignal" ADD COLUMN IF NOT EXISTS "stationScreenId" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'PassSignal_stationScreenId_fkey'
  ) THEN
    ALTER TABLE "PassSignal"
      ADD CONSTRAINT "PassSignal_stationScreenId_fkey"
      FOREIGN KEY ("stationScreenId") REFERENCES "VenueStationScreen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- Backfill one screen per station from existing venue tokens (keeps current links working)
INSERT INTO "VenueStationScreen" ("id", "venueId", "station", "label", "screenToken", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v."id", 'KITCHEN'::"PassStation", 'Κουζίνα', v."kitchenScreenToken", 0, NOW(), NOW()
FROM "Venue" v
WHERE NOT EXISTS (
  SELECT 1 FROM "VenueStationScreen" s WHERE s."venueId" = v."id" AND s."station" = 'KITCHEN'
);

INSERT INTO "VenueStationScreen" ("id", "venueId", "station", "label", "screenToken", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v."id", 'BAR'::"PassStation", 'Μπαρ', v."barScreenToken", 0, NOW(), NOW()
FROM "Venue" v
WHERE NOT EXISTS (
  SELECT 1 FROM "VenueStationScreen" s WHERE s."venueId" = v."id" AND s."station" = 'BAR'
);

INSERT INTO "VenueStationScreen" ("id", "venueId", "station", "label", "screenToken", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v."id", 'COLD'::"PassStation", 'Κρύα', v."coldScreenToken", 0, NOW(), NOW()
FROM "Venue" v
WHERE NOT EXISTS (
  SELECT 1 FROM "VenueStationScreen" s WHERE s."venueId" = v."id" AND s."station" = 'COLD'
);

INSERT INTO "VenueStationScreen" ("id", "venueId", "station", "label", "screenToken", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, v."id", 'DESSERT'::"PassStation", 'Γλυκά', v."dessertScreenToken", 0, NOW(), NOW()
FROM "Venue" v
WHERE NOT EXISTS (
  SELECT 1 FROM "VenueStationScreen" s WHERE s."venueId" = v."id" AND s."station" = 'DESSERT'
);
