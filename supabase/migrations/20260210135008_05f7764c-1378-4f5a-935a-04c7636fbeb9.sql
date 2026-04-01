
-- Add image_url column to complaints table
ALTER TABLE public.complaints ADD COLUMN image_url text;

-- Create storage bucket for complaint images
INSERT INTO storage.buckets (id, name, public) VALUES ('complaint-images', 'complaint-images', false);

-- Students can upload images to their own folder
CREATE POLICY "Students can upload complaint images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-images'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
);

-- Students can view their own complaint images
CREATE POLICY "Students can view own complaint images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-images'
  AND (
    (storage.foldername(name))[1] = (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
    OR public.get_user_role(auth.uid()) = 'admin'::user_role
  )
);

-- Admins can view all complaint images
-- (covered by the SELECT policy above with the OR condition)

-- Students can delete their own complaint images (for re-upload)
CREATE POLICY "Students can delete own complaint images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-images'
  AND (storage.foldername(name))[1] = (SELECT id::text FROM public.profiles WHERE user_id = auth.uid())
);
