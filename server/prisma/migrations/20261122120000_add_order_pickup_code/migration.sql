-- F-08: add a stable four-character pickup code to each order.
ALTER TABLE "Order" ADD COLUMN "pickupCode" VARCHAR(4);

DO $$
DECLARE
  order_row RECORD;
  generated_code VARCHAR(4);
  character_index INTEGER;
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
BEGIN
  FOR order_row IN SELECT "id" FROM "Order" LOOP
    LOOP
      generated_code := '';
      FOR character_index IN 1..4 LOOP
        generated_code := generated_code || SUBSTRING(
          alphabet FROM FLOOR(RANDOM() * LENGTH(alphabet))::INTEGER + 1 FOR 1
        );
      END LOOP;
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
