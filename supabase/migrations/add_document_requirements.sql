-- Create document types table for organization-level document definitions
CREATE TABLE IF NOT EXISTS public.document_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organization_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  file_types TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'jpeg', 'png'],
  max_size_mb DECIMAL(5,2) DEFAULT 10,
  validity_days INTEGER, -- NULL means no expiry
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(organization_id, name)
);

-- Create junction table for loan product document requirements
CREATE TABLE IF NOT EXISTS public.loan_product_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_product_id UUID REFERENCES public.loan_products(id) ON DELETE CASCADE,
  document_type_id UUID REFERENCES public.document_types(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT true,
  custom_instructions TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(loan_product_id, document_type_id)
);

-- Add indexes for performance
CREATE INDEX idx_document_types_organization ON public.document_types(organization_id);
CREATE INDEX idx_document_types_active ON public.document_types(is_active);
CREATE INDEX idx_loan_product_documents_product ON public.loan_product_documents(loan_product_id);
CREATE INDEX idx_loan_product_documents_document ON public.loan_product_documents(document_type_id);

-- Enable RLS
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_product_documents ENABLE ROW LEVEL SECURITY;

-- Policies for document_types
CREATE POLICY "Anyone can view active document types" 
  ON public.document_types
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can view all document types" 
  ON public.document_types
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert document types" 
  ON public.document_types
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update document types" 
  ON public.document_types
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete document types" 
  ON public.document_types
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Policies for loan_product_documents
CREATE POLICY "Anyone can view loan product documents" 
  ON public.loan_product_documents
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can insert loan product documents" 
  ON public.loan_product_documents
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update loan product documents" 
  ON public.loan_product_documents
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete loan product documents" 
  ON public.loan_product_documents
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Add triggers for audit logging
CREATE TRIGGER audit_document_types
  AFTER INSERT OR UPDATE OR DELETE ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_loan_product_documents
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_product_documents
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_document_types_updated_at
  BEFORE UPDATE ON public.document_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_product_documents_updated_at
  BEFORE UPDATE ON public.loan_product_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert common document types as examples (optional, organization-specific)
-- These will be created when an organization is set up
-- INSERT INTO public.document_types (organization_id, name, description, instructions, file_types, max_size_mb, validity_days, display_order)
-- VALUES 
--   (org_id, 'Bank Statement', 'Recent bank statement showing account activity', 'Please upload your most recent bank statement (last 3 months)', ARRAY['pdf'], 5, 90, 1),
--   (org_id, 'Proof of Identity', 'Government-issued ID document', 'Upload a clear copy of your passport, driver''s license, or national ID', ARRAY['pdf', 'jpg', 'jpeg', 'png'], 2, NULL, 2),
--   (org_id, 'Proof of Address', 'Document showing current residential address', 'Utility bill, rental agreement, or bank statement showing your current address (not older than 3 months)', ARRAY['pdf', 'jpg', 'jpeg', 'png'], 2, 90, 3),
--   (org_id, 'Income Verification', 'Proof of income or employment', 'Recent payslips, employment letter, or tax returns', ARRAY['pdf'], 5, 180, 4),
--   (org_id, 'Business Registration', 'Company registration documents', 'Certificate of incorporation or business registration certificate', ARRAY['pdf'], 10, NULL, 5),
--   (org_id, 'Financial Statements', 'Business financial statements', 'Audited financial statements for the last financial year', ARRAY['pdf'], 20, 365, 6),
--   (org_id, 'Tax Returns', 'Tax filing documents', 'Latest tax returns or tax clearance certificate', ARRAY['pdf'], 10, 365, 7),
--   (org_id, 'Collateral Documents', 'Documents for loan collateral', 'Title deeds, vehicle registration, or other collateral documentation', ARRAY['pdf'], 15, NULL, 8);