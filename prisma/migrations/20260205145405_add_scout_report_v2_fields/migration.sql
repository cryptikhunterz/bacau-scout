-- DropIndex
DROP INDEX "ScoutingReport_recommendation_idx";

-- AlterTable
ALTER TABLE "ScoutingReport" ADD COLUMN     "ability" INTEGER,
ADD COLUMN     "conclusion" TEXT,
ADD COLUMN     "physAgility" INTEGER,
ADD COLUMN     "physCoordination" INTEGER,
ADD COLUMN     "physSpeed" INTEGER,
ADD COLUMN     "physStrength" INTEGER,
ADD COLUMN     "potential" INTEGER,
ADD COLUMN     "report" INTEGER,
ADD COLUMN     "role" TEXT,
ADD COLUMN     "salary" TEXT,
ADD COLUMN     "scoutingLevel" TEXT,
ADD COLUMN     "scoutingTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "status" TEXT,
ADD COLUMN     "tacAnticipations" INTEGER,
ADD COLUMN     "tacDecisions" INTEGER,
ADD COLUMN     "tacDuels" INTEGER,
ADD COLUMN     "tacPositioning" INTEGER,
ADD COLUMN     "tacSetPieces" INTEGER,
ADD COLUMN     "tacTransition" INTEGER,
ADD COLUMN     "techAerial" INTEGER,
ADD COLUMN     "techControl" INTEGER,
ADD COLUMN     "techCrossing" INTEGER,
ADD COLUMN     "techDribbling" INTEGER,
ADD COLUMN     "techFinishing" INTEGER,
ADD COLUMN     "techLongPasses" INTEGER,
ADD COLUMN     "techOneVsOneDefense" INTEGER,
ADD COLUMN     "techOneVsOneOffense" INTEGER,
ADD COLUMN     "techShortPasses" INTEGER,
ADD COLUMN     "transferFee" TEXT,
ADD COLUMN     "verdict" TEXT;

-- CreateIndex
CREATE INDEX "ScoutingReport_verdict_idx" ON "ScoutingReport"("verdict");
