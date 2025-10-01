-- First, let's see all current policies on shuttle_preferences
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'shuttle_preferences';

-- Drop all existing admin policies to clean up
DROP POLICY IF EXISTS "Admins can view all shuttle preferences" ON shuttle_preferences;
DROP POLICY IF EXISTS "Admins can manage all shuttle preferences" ON shuttle_preferences;
DROP POLICY IF EXISTS "Admins can insert shuttle preferences" ON shuttle_preferences;
DROP POLICY IF EXISTS "Admins can update shuttle preferences" ON shuttle_preferences;
DROP POLICY IF EXISTS "Admins can delete shuttle preferences" ON shuttle_preferences;

-- Create fresh admin policies with proper permissions
CREATE POLICY "Admins have full access to shuttle preferences"
ON shuttle_preferences
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));