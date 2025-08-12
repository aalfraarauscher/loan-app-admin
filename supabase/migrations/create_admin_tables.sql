-- Create admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'viewer')) DEFAULT 'admin',
  organization_id UUID REFERENCES public.organization_config(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create audit log table for tracking configuration changes
CREATE TABLE IF NOT EXISTS public.config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.admin_users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add version tracking to existing tables (if not already added)
ALTER TABLE public.organization_config 
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

ALTER TABLE public.app_theme 
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies for admin_users
CREATE POLICY "Admin users can view their own profile" 
  ON public.admin_users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Super admins can view all admin users" 
  ON public.admin_users
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policies for config_audit_log (read-only for admins)
CREATE POLICY "Admins can view audit logs" 
  ON public.config_audit_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid()
    )
  );

-- Update policies for configuration tables to require admin role
DROP POLICY IF EXISTS "Users can view organization config" ON public.organization_config;
CREATE POLICY "Anyone can view organization config" 
  ON public.organization_config
  FOR SELECT 
  USING (true);

CREATE POLICY "Admins can update organization config" 
  ON public.organization_config
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert organization config" 
  ON public.organization_config
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Similar policies for app_theme
CREATE POLICY "Admins can update app theme" 
  ON public.app_theme
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert app theme" 
  ON public.app_theme
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Policies for loan_products management
CREATE POLICY "Admins can update loan products" 
  ON public.loan_products
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can insert loan products" 
  ON public.loan_products
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete loan products" 
  ON public.loan_products
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Function to log configuration changes
CREATE OR REPLACE FUNCTION log_config_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.config_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for audit logging
CREATE TRIGGER audit_organization_config
  AFTER INSERT OR UPDATE OR DELETE ON public.organization_config
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_app_theme
  AFTER INSERT OR UPDATE OR DELETE ON public.app_theme
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

CREATE TRIGGER audit_loan_products
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_products
  FOR EACH ROW EXECUTE FUNCTION log_config_change();

-- Insert a test admin user (you'll need to create an auth user first)
-- Example: After creating an auth user via Supabase dashboard, run:
-- INSERT INTO public.admin_users (id, email, full_name, role)
-- VALUES ('your-auth-user-id', 'admin@example.com', 'Admin User', 'super_admin');