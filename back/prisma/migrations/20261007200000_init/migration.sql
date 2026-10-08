-- CreateTable
CREATE TABLE "pools" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "volume_liters" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parameter_definitions" (
    "id" TEXT NOT NULL,
    "system_key" TEXT,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '',
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "enabled_by_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parameter_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pool_parameters" (
    "pool_id" TEXT NOT NULL,
    "parameter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pool_parameters_pkey" PRIMARY KEY ("pool_id","parameter_id")
);

-- CreateTable
CREATE TABLE "measurements" (
    "id" TEXT NOT NULL,
    "pool_id" TEXT NOT NULL,
    "parameter_id" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parameter_definitions_system_key_key" ON "parameter_definitions"("system_key");

-- CreateIndex
CREATE UNIQUE INDEX "parameter_definitions_name_key" ON "parameter_definitions"("name");

-- CreateIndex
CREATE INDEX "pool_parameters_parameter_id_idx" ON "pool_parameters"("parameter_id");

-- CreateIndex
CREATE INDEX "measurements_pool_id_parameter_id_measured_at_idx" ON "measurements"("pool_id", "parameter_id", "measured_at" DESC);

-- AddForeignKey
ALTER TABLE "pool_parameters" ADD CONSTRAINT "pool_parameters_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pool_parameters" ADD CONSTRAINT "pool_parameters_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "parameter_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_pool_id_fkey" FOREIGN KEY ("pool_id") REFERENCES "pools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "measurements" ADD CONSTRAINT "measurements_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "parameter_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
