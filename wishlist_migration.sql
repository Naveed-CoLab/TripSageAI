--- Create wishlist_items table
CREATE TABLE IF NOT EXISTS "wishlist_items" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "item_type" TEXT NOT NULL,
  "item_id" TEXT NOT NULL,
  "item_name" TEXT NOT NULL,
  "item_image" TEXT,
  "additional_data" JSONB,
  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "wishlist_user_id_idx" ON "wishlist_items"("user_id");
CREATE INDEX IF NOT EXISTS "wishlist_item_type_idx" ON "wishlist_items"("item_type");
