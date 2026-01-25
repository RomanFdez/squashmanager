-- Add birth_date column to members table
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS birth_date date;
