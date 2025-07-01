ALTER TABLE public.quotes
ADD COLUMN customer_type TEXT DEFAULT 'residential';

-- Optional: Update existing rows to 'residential' if they are not set
UPDATE public.quotes
SET customer_type = 'residential'
WHERE customer_type IS NULL;

-- Optional: Add a check constraint if you want to enforce specific values
ALTER TABLE public.quotes
ADD CONSTRAINT customer_type_check CHECK (customer_type IN ('residential', 'commercial'));
