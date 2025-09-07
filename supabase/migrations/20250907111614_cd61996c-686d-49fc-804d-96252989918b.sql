-- Create tables for seating arrangements
CREATE TABLE public.wedding_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  table_name TEXT,
  capacity INTEGER NOT NULL DEFAULT 8,
  x_position DECIMAL(5,2) DEFAULT 0,
  y_position DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add table assignment to invited guests
ALTER TABLE public.invited_guests 
ADD COLUMN table_id UUID REFERENCES public.wedding_tables(id) ON DELETE SET NULL;

-- Add table assignment to additional guests  
ALTER TABLE public.additional_guests
ADD COLUMN table_id UUID REFERENCES public.wedding_tables(id) ON DELETE SET NULL;

-- Enable RLS on wedding_tables
ALTER TABLE public.wedding_tables ENABLE ROW LEVEL SECURITY;

-- Create policies for wedding_tables
CREATE POLICY "Admins can manage wedding tables" 
ON public.wedding_tables 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view wedding tables" 
ON public.wedding_tables 
FOR SELECT 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_invited_guests_table_id ON public.invited_guests(table_id);
CREATE INDEX idx_additional_guests_table_id ON public.additional_guests(table_id);
CREATE INDEX idx_wedding_tables_number ON public.wedding_tables(table_number);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_wedding_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_wedding_tables_updated_at
BEFORE UPDATE ON public.wedding_tables
FOR EACH ROW
EXECUTE FUNCTION public.update_wedding_tables_updated_at();