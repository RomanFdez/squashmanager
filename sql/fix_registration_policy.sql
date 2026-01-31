-- Drop the existing "Self Registration" policy
DROP POLICY IF EXISTS "Self Registration" ON tournament_registrations;

-- Create updated policy that allows registrations for 'draft' and 'open' tournaments
CREATE POLICY "Self Registration" ON tournament_registrations
FOR INSERT WITH CHECK (
  is_self_registered = TRUE AND
  EXISTS (
    SELECT 1 FROM tournament_categories tc
    JOIN tournaments t ON t.id = tc.tournament_id
    WHERE tc.id = category_id 
    AND t.status IN ('draft', 'open')
    AND t.registration_deadline >= CURRENT_DATE
  )
);
