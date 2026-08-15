-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "DrillSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "notesText" TEXT NOT NULL DEFAULT '',
    "audioData" BYTEA,
    "audioMimeType" TEXT,
    "fluency" INTEGER NOT NULL DEFAULT 0,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "coverage" INTEGER NOT NULL DEFAULT 0,
    "failureNote" TEXT NOT NULL DEFAULT '',
    "wasRerolled" BOOLEAN NOT NULL DEFAULT false,
    "isRevisit" BOOLEAN NOT NULL DEFAULT false,
    "durationSpoken" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DrillSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyDraw" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "isRevisit" BOOLEAN NOT NULL DEFAULT false,
    "wasRerolled" BOOLEAN NOT NULL DEFAULT false,
    "rerollUsed" BOOLEAN NOT NULL DEFAULT false,
    "phase" TEXT NOT NULL,
    "notesText" TEXT NOT NULL DEFAULT '',
    "researchEndsAt" TIMESTAMP(3),
    "recallEndsAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyDraw_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuthSession_userId_idx" ON "AuthSession"("userId");

-- CreateIndex
CREATE INDEX "DrillSession_userId_date_idx" ON "DrillSession"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyDraw_userId_date_key" ON "DailyDraw"("userId", "date");

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DrillSession" ADD CONSTRAINT "DrillSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyDraw" ADD CONSTRAINT "DailyDraw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
