-- Gold labels are versioned by month through new rows, never edited in place.
CREATE TRIGGER gold_immutable BEFORE UPDATE OR DELETE ON "GoldSetItem"
FOR EACH ROW EXECUTE FUNCTION reject_mutation();
