-- Fix the notifications insert policy to be more restrictive
-- Only allow admins to create notifications for users
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Admins can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

-- Allow initial admin profile creation (bootstrap)
CREATE POLICY "Allow first admin creation" ON public.profiles
  FOR INSERT WITH CHECK (
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
    OR public.get_user_role(auth.uid()) = 'admin'
  );