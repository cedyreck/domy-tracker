-- Add domy_relationships to realtime publication for proper balance sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.domy_relationships;