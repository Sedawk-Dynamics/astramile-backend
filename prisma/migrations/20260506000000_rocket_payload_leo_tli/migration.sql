-- Rocket: split single payloadKg into separate LEO and TLI payload columns.
-- Existing payloadKg values were labelled "to LEO" on the site, so preserve them under payloadLeoKg.
ALTER TABLE "Rocket" RENAME COLUMN "payloadKg" TO "payloadLeoKg";
ALTER TABLE "Rocket" ADD COLUMN "payloadTliKg" DOUBLE PRECISION;
