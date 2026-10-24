-- Removes duplicate notifications (same user, title, body and link), keeping
-- the newest row of each group. Unread state is kept if any copy was unread.
WITH ranked AS (
  SELECT id,
         user_id, title, body, href,
         row_number() OVER (PARTITION BY user_id, title, body, coalesce(href, '') ORDER BY created_at DESC, id) AS rn,
         bool_or(read_at IS NULL) OVER (PARTITION BY user_id, title, body, coalesce(href, '')) AS any_unread
  FROM notification
),
keep AS (
  UPDATE notification n SET read_at = NULL
  FROM ranked r
  WHERE n.id = r.id AND r.rn = 1 AND r.any_unread AND n.read_at IS NOT NULL
  RETURNING n.id
)
DELETE FROM notification n USING ranked r WHERE n.id = r.id AND r.rn > 1;
