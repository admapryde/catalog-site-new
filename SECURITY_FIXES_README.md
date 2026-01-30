# Security Fixes for Supabase RLS Policies

## Overview
This document outlines the security fixes applied to address the issues identified by the Supabase Performance Security Lints.

## Issues Identified
The Supabase linter identified the following security vulnerabilities:

1. **RLS Disabled in Public Table**: The `spec_filters` table was public but didn't have Row Level Security enabled.
2. **RLS References User Metadata**: Multiple tables had RLS policies that referenced `user_metadata`, which is insecure as it can be modified by end users.

Tables affected:
- `general_settings`
- `pages`
- `page_blocks`
- `page_block_images`
- `page_block_links`
- `homepage_blocks`
- `homepage_layouts`

## Solution Implemented

### 1. Secure Role Management System
Instead of relying on user-editable `user_metadata`, we implemented a secure role management system using a dedicated `profiles` table:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);
```

### 2. Secure RLS Policies
All affected tables now use the secure profiles table for role checking:

```sql
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
```

### 3. Automatic Profile Creation
A trigger automatically creates a profile for each new user:

```sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_profile_for_new_user();
```

## Files Created/Modified

1. `fix-rls-policies.sql` - Contains all the security fixes
2. This document (`SECURITY_FIXES_README.md`)

## Implementation Steps

1. Execute the `fix-rls-policies.sql` script in your Supabase database
2. Update your application code to manage user roles through the profiles table instead of user_metadata
3. Ensure that only admin/service roles can modify the role field in the profiles table

## Important Notes

- The `user_metadata` field in Supabase Auth is editable by end users and should never be used in security contexts
- Always use a dedicated table (like `profiles`) for storing security-sensitive information
- Only allow role changes through admin interfaces or service role functions
- The service_role can still bypass RLS for administrative operations

## Verification

After applying these fixes, run the Supabase linter again to confirm that the security warnings are resolved.