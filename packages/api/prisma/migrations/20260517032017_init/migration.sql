-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('Pleno', 'Cadete', 'Honorario');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('Activo', 'Moroso', 'Suspendido');

-- CreateEnum
CREATE TYPE "LockerStatus" AS ENUM ('Available', 'Occupied', 'Maintenance');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pending', 'Paid', 'Canceled');

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "birthdate" DATE,
    "category" "MemberCategory" NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'Activo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lockers" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "status" "LockerStatus" NOT NULL DEFAULT 'Available',
    "member_id" TEXT,

    CONSTRAINT "lockers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'Pending',
    "due_date" DATE NOT NULL,
    "payment_date" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),
    "member_id" TEXT NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_certificates" (
    "id" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "expiry_date" DATE NOT NULL,
    "doctor_license" TEXT NOT NULL,
    "is_validated" BOOLEAN NOT NULL DEFAULT true,
    "member_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "medical_certificates_pkey" PRIMARY KEY ("id")
);

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

-- CreateIndex
CREATE UNIQUE INDEX "members_dni_key" ON "members"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "lockers_number_key" ON "lockers"("number");

-- AddForeignKey
ALTER TABLE "lockers" ADD CONSTRAINT "lockers_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_certificates" ADD CONSTRAINT "medical_certificates_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discipline" ADD CONSTRAINT "Discipline_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
