-- Function to expire stale orders (orders active for more than 7 days)
-- Can be called by a cron job or the matching engine
CREATE OR REPLACE FUNCTION expire_stale_orders()
RETURNS INT AS $$
DECLARE
  expired_count INT;
BEGIN
  UPDATE orders
  SET status = 'EXPIRED', updated_at = NOW()
  WHERE status = 'ACTIVE'
    AND created_at < NOW() - INTERVAL '7 days';
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ language 'plpgsql';
