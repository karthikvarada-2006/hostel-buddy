-- Add student-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS jntu_number TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS year TEXT;