-- Enable realtime for pending_updates table
ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_updates;

-- Enable realtime for activity_logs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;