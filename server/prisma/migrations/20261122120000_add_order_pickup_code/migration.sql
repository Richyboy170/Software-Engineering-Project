-- F-08: add a stable four-character pickup code to each order.
ALTER TABLE "Order" ADD COLUMN "pickupCode" VARCHAR(4);

UPDATE "Order"
SET "pickupCode" = UPPER(SUBSTRING("orderNumber" FROM 4 FOR 4))
WHERE "pickupCode" IS NULL;

ALTER TABLE "Order" ALTER COLUMN "pickupCode" SET NOT NULL;

CREATE UNIQUE INDEX "Order_pickupCode_key" ON "Order"("pickupCode");
