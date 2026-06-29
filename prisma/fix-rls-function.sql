-- Fix: rls_auto_enable() SECURITY DEFINER vulnerability
-- The function public.rls_auto_enable() was callable by the anon role
-- as SECURITY DEFINER, allowing unauthenticated execution.
-- 
-- Run this against your PostgreSQL database to fix.
-- Usage: psql -d your_database -f prisma/fix-rls-function.sql

-- Revoke execute from public/anonymous roles
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;

-- Drop the function entirely if no longer needed
-- (comment out if you still use it internally)
DROP FUNCTION IF EXISTS public.rls_auto_enable();

-- Alternatively, if you need to keep it but make it safe:
-- ALTER FUNCTION public.rls_auto_enable() SECURITY INVOKER;
