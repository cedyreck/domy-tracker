-- Add paid status to session_scores
ALTER TABLE public.session_scores ADD COLUMN paid boolean NOT NULL DEFAULT false;
ALTER TABLE public.session_scores ADD COLUMN paid_at timestamp with time zone;
ALTER TABLE public.session_scores ADD COLUMN paid_by uuid;

-- Allow admins to update session_scores (for marking as paid)
CREATE POLICY "Admins can update session scores"
ON public.session_scores
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update user roles (for promoting users)
CREATE POLICY "Admins can update user roles"
ON public.user_roles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));