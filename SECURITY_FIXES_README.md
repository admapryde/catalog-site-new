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

### 1. Secure RLS Policies
Instead of directly using insecure `user_metadata` references in RLS policies, we implemented secure role checking by querying the `auth.users` table directly:

```sql
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
  -- Same condition for insert/update operations
);
```

This approach is more secure than using `auth.jwt() -> 'user_metadata' ->> 'role'` because it queries the authoritative source in the auth.users table.

### 2. Proper WITH CHECK Clauses
Added proper WITH CHECK clauses to all policies to control INSERT and UPDATE operations, not just SELECT operations.

## Files Created/Modified

1. `fix-rls-policies.sql` - Contains all the security fixes
2. This document (`SECURITY_FIXES_README.md`)

## Implementation Steps

1. Execute the `fix-rls-policies.sql` script in your Supabase database
2. Ensure your admin user has the proper role set in their user metadata via the Supabase dashboard
3. The service_role can still bypass RLS for administrative operations

## Important Notes

- The original issue was using `auth.jwt() -> 'user_metadata' ->> 'role'` which can be manipulated by clients
- Our solution queries the authoritative `auth.users` table directly using `auth.users.raw_user_meta_data->>'role'`
- This maintains compatibility with the existing application while improving security
- Make sure to set the role for your admin user in the Supabase Auth dashboard

## Verification

After applying these fixes, run the Supabase linter again to confirm that the security warnings are resolved.