-- Fix RLS policies to address security vulnerabilities
-- Replace insecure user_metadata references with secure alternatives

-- Fix general_settings table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage general settings" ON general_settings;
CREATE POLICY "Admin can manage general settings" ON general_settings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix pages table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage pages" ON pages;
CREATE POLICY "Admin can manage pages" ON pages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_blocks table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage page blocks" ON page_blocks;
CREATE POLICY "Admin can manage page blocks" ON page_blocks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_block_images table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage page block images" ON page_block_images;
CREATE POLICY "Admin can manage page block images" ON page_block_images
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_block_links table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage page block links" ON page_block_links;
CREATE POLICY "Admin can manage page block links" ON page_block_links
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix homepage_blocks table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage homepage blocks" ON homepage_blocks;
CREATE POLICY "Admin can manage homepage blocks" ON homepage_blocks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix homepage_layouts table RLS policy - use secure role checking
DROP POLICY IF EXISTS "Admin can manage homepage layouts" ON homepage_layouts;
CREATE POLICY "Admin can manage homepage layouts" ON homepage_layouts
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin'
      OR auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);