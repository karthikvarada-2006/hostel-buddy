-- Allow admins to delete profiles
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE USING (public.get_user_role(auth.uid()) = 'admin');

-- Update attendance marked_by to set null on delete to avoid blocking student deletion
ALTER TABLE public.attendance 
  DROP CONSTRAINT IF EXISTS attendance_marked_by_fkey,
  ADD CONSTRAINT attendance_marked_by_fkey 
  FOREIGN KEY (marked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update food_menu created_by to set null on delete
ALTER TABLE public.food_menu
  DROP CONSTRAINT IF EXISTS food_menu_created_by_fkey,
  ADD CONSTRAINT food_menu_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update notices created_by to set null on delete
ALTER TABLE public.notices
  DROP CONSTRAINT IF EXISTS notices_created_by_fkey,
  ADD CONSTRAINT notices_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Update passes approved_by to set null on delete
ALTER TABLE public.passes
  DROP CONSTRAINT IF EXISTS passes_approved_by_fkey,
  ADD CONSTRAINT passes_approved_by_fkey 
  FOREIGN KEY (approved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
