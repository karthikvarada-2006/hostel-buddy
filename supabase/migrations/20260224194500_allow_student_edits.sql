-- Add is_edited column to complaints table
ALTER TABLE public.complaints ADD COLUMN is_edited BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow students to edit in_progress complaints as well
-- First drop the existing restrictive update policy
DROP POLICY IF EXISTS "Students can update their own pending complaints" ON public.complaints;

-- Create a more permissive one (allowing pending and in_progress)
CREATE POLICY "Students can update their own active complaints" ON public.complaints
  FOR UPDATE USING (
    student_id = public.get_profile_id(auth.uid()) 
    AND (status = 'pending' OR status = 'in_progress')
  );
