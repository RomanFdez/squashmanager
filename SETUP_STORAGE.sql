-- Create a new storage bucket for member photos
INSERT INTO storage.buckets (id, name, public) VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can view photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'member-photos' );

-- Policy: Only authenticated users can upload photos
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'member-photos' );

-- Policy: Users can update their own uploads (or admins, simplifying for now allow updates)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'member-photos' );
