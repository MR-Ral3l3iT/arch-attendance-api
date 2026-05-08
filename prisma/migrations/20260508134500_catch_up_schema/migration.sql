-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('SICK', 'PERSONAL');

-- DropIndex
DROP INDEX "Section_courseId_name_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "divisionId" TEXT;

-- AlterTable
ALTER TABLE "LeaveRequest" ADD COLUMN     "leaveType" "LeaveType" NOT NULL DEFAULT 'SICK';

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "maxStudents" INTEGER,
ADD COLUMN     "semesterId" TEXT NOT NULL,
ADD COLUMN     "yearLevelId" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "profileImageUrl" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "profileImageUrl" TEXT;

-- CreateTable
CREATE TABLE "Division" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Division_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holiday" (
    "id" TEXT NOT NULL,
    "semesterId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleCancellation" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "classDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "cancelledById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduleCancellation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Division_code_key" ON "Division"("code");

-- CreateIndex
CREATE INDEX "Holiday_semesterId_date_idx" ON "Holiday"("semesterId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Holiday_semesterId_date_key" ON "Holiday"("semesterId", "date");

-- CreateIndex
CREATE INDEX "ScheduleCancellation_scheduleId_classDate_idx" ON "ScheduleCancellation"("scheduleId", "classDate");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleCancellation_scheduleId_classDate_key" ON "ScheduleCancellation"("scheduleId", "classDate");

-- CreateIndex
CREATE UNIQUE INDEX "Section_courseId_semesterId_name_key" ON "Section"("courseId", "semesterId", "name");

-- AddForeignKey
ALTER TABLE "Division" ADD CONSTRAINT "Division_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "Division"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_yearLevelId_fkey" FOREIGN KEY ("yearLevelId") REFERENCES "YearLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "Semester"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holiday" ADD CONSTRAINT "Holiday_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCancellation" ADD CONSTRAINT "ScheduleCancellation_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleCancellation" ADD CONSTRAINT "ScheduleCancellation_cancelledById_fkey" FOREIGN KEY ("cancelledById") REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

