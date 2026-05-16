-- AlterTable
ALTER TABLE "lockers" ADD COLUMN     "sportId" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "sportId" TEXT;

-- CreateTable
CREATE TABLE "sport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "max_capacity" INTEGER NOT NULL,
    "additional_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "requires_medical_certificate" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discipline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_total_suspension" BOOLEAN NOT NULL DEFAULT false,
    "member_id" TEXT NOT NULL,

    CONSTRAINT "Discipline_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
