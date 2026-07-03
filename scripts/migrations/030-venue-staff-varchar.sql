-- Align VenueStaffMember text columns with Prisma VarChar limits (safe if names fit).

ALTER TABLE "VenueStaffMember" ALTER COLUMN "name" TYPE VARCHAR(60);
ALTER TABLE "VenueStaffMember" ALTER COLUMN "roleLabel" TYPE VARCHAR(40);
