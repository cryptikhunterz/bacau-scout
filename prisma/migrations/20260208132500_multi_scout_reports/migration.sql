-- DropIndex (old unique on playerId alone)
DROP INDEX "ScoutingReport_playerId_key";

-- CreateIndex (new composite unique on playerId + scoutId)
CREATE UNIQUE INDEX "ScoutingReport_playerId_scoutId_key" ON "ScoutingReport"("playerId", "scoutId");

-- CreateIndex (index on scoutId for lookups)
CREATE INDEX "ScoutingReport_scoutId_idx" ON "ScoutingReport"("scoutId");
