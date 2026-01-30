-- Fix RLS policies to address security vulnerabilities
-- Replace insecure user_metadata references with secure alternatives using a dedicated profiles table

-- First, ensure we have a profiles table with secure role management
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles table - users can only view their own profile
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT TO authenticated
USING (auth.uid() = id);

-- Create policy for profiles table - service role can manage all profiles
CREATE POLICY "Service role can manage all profiles" ON profiles
FOR ALL TO service_role
USING (true)
WITH CHECK (true);

-- Update the trigger function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles table
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Fix general_settings table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage general settings" ON general_settings;
CREATE POLICY "Admin can manage general settings" ON general_settings
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix pages table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage pages" ON pages;
CREATE POLICY "Admin can manage pages" ON pages
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_blocks table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage page blocks" ON page_blocks;
CREATE POLICY "Admin can manage page blocks" ON page_blocks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_block_images table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage page block images" ON page_block_images;
CREATE POLICY "Admin can manage page block images" ON page_block_images
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix page_block_links table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage page block links" ON page_block_links;
CREATE POLICY "Admin can manage page block links" ON page_block_links
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix homepage_blocks table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage homepage blocks" ON homepage_blocks;
CREATE POLICY "Admin can manage homepage blocks" ON homepage_blocks
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Fix homepage_layouts table RLS policy - use profiles table instead of user_metadata
DROP POLICY IF EXISTS "Admin can manage homepage layouts" ON homepage_layouts;
CREATE POLICY "Admin can manage homepage layouts" ON homepage_layouts
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
  OR (
    auth.jwt() ->> 'role' = 'service_role'
  )
);

-- Create a function to properly handle new user creation
CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user'); -- Default role is 'user'
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();

-- Create a function to check admin status securely
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;