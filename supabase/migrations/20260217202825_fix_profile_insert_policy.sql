-- Fix: Allow users to create their own profile during signup
-- This policy enables authenticated users to insert their profile record
-- when they sign up, which was previously blocked by RLS policies

CREATE POLICY "Users can create own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
