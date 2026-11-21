-- F-08: add a stable four-character pickup code to each order.
ALTER TABLE "Order" ADD COLUMN "pickupCode" VARCHAR(4);

DO $$
DECLARE
  order_row RECORD;
  generated_code VARCHAR(4);
BEGIN
  FOR order_row IN SELECT "id" FROM "Order" LOOP
    LOOP
      generated_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT || order_row."id") FROM 1 FOR 4));
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM "Order" WHERE "pickupCode" = generated_code
      );
    END LOOP;

    UPDATE "Order"
    SET "pickupCode" = generated_code
    WHERE "id" = order_row."id";
  END LOOP;
END $$;

ALTER TABLE "Order" ALTER COLUMN "pickupCode" SET NOT NULL;

CREATE UNIQUE INDEX "Order_pickupCode_key" ON "Order"("pickupCode");
