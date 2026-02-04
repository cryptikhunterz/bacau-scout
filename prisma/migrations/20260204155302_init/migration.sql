-- CreateTable
CREATE TABLE "ScoutingReport" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "ballControl" INTEGER,
    "passing" INTEGER,
    "dribbling" INTEGER,
    "finishing" INTEGER,
    "pace" INTEGER,
    "stamina" INTEGER,
    "strength" INTEGER,
    "positioning" INTEGER,
    "movement" INTEGER,
    "creativity" INTEGER,
    "decisionMaking" INTEGER,
    "workRate" INTEGER,
    "discipline" INTEGER,
    "recommendation" TEXT,
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "scoutName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScoutingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScoutingReport_playerId_idx" ON "ScoutingReport"("playerId");

-- CreateIndex
CREATE INDEX "ScoutingReport_recommendation_idx" ON "ScoutingReport"("recommendation");

-- CreateIndex
CREATE UNIQUE INDEX "ScoutingReport_playerId_key" ON "ScoutingReport"("playerId");
