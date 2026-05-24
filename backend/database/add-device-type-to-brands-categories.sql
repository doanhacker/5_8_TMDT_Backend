-- Add device_type support for brands and categories.
-- Run this script once on existing databases.

ALTER TABLE brands
  ADD COLUMN device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NULL AFTER logo_url;

ALTER TABLE categories
  ADD COLUMN device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NULL AFTER parent_category_id;

-- Infer category device_type from linked products when possible.
UPDATE categories c
JOIN (
  SELECT p.category_id, UPPER(TRIM(p.device_type)) AS device_type
  FROM products p
  JOIN (
    SELECT category_id, MAX(cnt) AS max_cnt
    FROM (
      SELECT category_id, UPPER(TRIM(device_type)) AS device_type, COUNT(*) AS cnt
      FROM products
      WHERE category_id IS NOT NULL
      GROUP BY category_id, UPPER(TRIM(device_type))
    ) grouped
    GROUP BY category_id
  ) best ON best.category_id = p.category_id
  JOIN (
    SELECT category_id, UPPER(TRIM(device_type)) AS device_type, COUNT(*) AS cnt
    FROM products
    WHERE category_id IS NOT NULL
    GROUP BY category_id, UPPER(TRIM(device_type))
  ) votes ON votes.category_id = p.category_id AND votes.device_type = UPPER(TRIM(p.device_type)) AND votes.cnt = best.max_cnt
  GROUP BY p.category_id, UPPER(TRIM(p.device_type))
) inferred ON inferred.category_id = c.category_id
SET c.device_type = inferred.device_type
WHERE c.device_type IS NULL;

-- Infer brand device_type from linked products when possible.
UPDATE brands b
JOIN (
  SELECT p.brand_id, UPPER(TRIM(p.device_type)) AS device_type
  FROM products p
  JOIN (
    SELECT brand_id, MAX(cnt) AS max_cnt
    FROM (
      SELECT brand_id, UPPER(TRIM(device_type)) AS device_type, COUNT(*) AS cnt
      FROM products
      WHERE brand_id IS NOT NULL
      GROUP BY brand_id, UPPER(TRIM(device_type))
    ) grouped
    GROUP BY brand_id
  ) best ON best.brand_id = p.brand_id
  JOIN (
    SELECT brand_id, UPPER(TRIM(device_type)) AS device_type, COUNT(*) AS cnt
    FROM products
    WHERE brand_id IS NOT NULL
    GROUP BY brand_id, UPPER(TRIM(device_type))
  ) votes ON votes.brand_id = p.brand_id AND votes.device_type = UPPER(TRIM(p.device_type)) AND votes.cnt = best.max_cnt
  GROUP BY p.brand_id, UPPER(TRIM(p.device_type))
) inferred ON inferred.brand_id = b.brand_id
SET b.device_type = inferred.device_type
WHERE b.device_type IS NULL;

UPDATE categories SET device_type = 'OTHER' WHERE device_type IS NULL;
UPDATE brands SET device_type = 'OTHER' WHERE device_type IS NULL;

ALTER TABLE categories
  MODIFY COLUMN device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NOT NULL DEFAULT 'OTHER';

-- Replace old unique index on brand_name with composite unique key.
ALTER TABLE brands DROP INDEX brand_name;
ALTER TABLE brands
  MODIFY COLUMN device_type ENUM('LAPTOP', 'PHONE', 'TABLET', 'WATCH', 'AUDIO', 'ACCESSORY', 'OTHER') NOT NULL DEFAULT 'OTHER',
  ADD UNIQUE KEY uniq_brand_name_device_type (brand_name, device_type);
