
-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

-- Allow authenticated users to read files
CREATE POLICY "Anyone can read materials" ON storage.objects FOR SELECT USING (bucket_id = 'materials');

-- Allow faculty/admin to upload files
CREATE POLICY "Faculty can upload materials" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'materials' AND (
    public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin')
  )
);

-- Allow faculty/admin to delete their files
CREATE POLICY "Faculty can delete materials" ON storage.objects FOR DELETE USING (
  bucket_id = 'materials' AND (
    public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin')
  )
);
