-- Enable Supabase Realtime broadcasting on the `messages` table.
-- Without this, postgres_changes subscriptions on the client never fire,
-- so the recipient of a message wouldn't see it without reloading.

alter publication supabase_realtime add table messages;

-- REPLICA IDENTITY FULL ensures old-row values are also broadcast for UPDATE/DELETE
-- (useful later for read receipts).
alter table messages replica identity full;
