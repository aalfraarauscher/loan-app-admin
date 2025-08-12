export interface OrganizationConfig {
  id: string
  name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  support_email?: string
  support_phone?: string
  terms_url?: string
  privacy_url?: string
  created_at: string
  updated_at: string
}

export interface AppTheme {
  id: string
  organization_id: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    card: string
    destructive: string
  }
  typography: {
    fontFamily: string
    headingSize: string
    bodySize: string
  }
  spacing: {
    unit: number
    containerPadding: string
  }
  borderRadius: string
  created_at: string
  updated_at: string
}

export interface LoanProduct {
  id: string
  name: string
  description: string
  purpose: string
  min_amount: number
  max_amount: number
  min_term_months: number
  max_term_months: number
  interest_rate: number
  processing_fee: number
  late_payment_fee: number
  grace_period_months: number
  eligibility_criteria: Record<string, any>
  required_documents: string[]
  is_active: boolean
  display_order: number
  icon_name: string
  created_at: string
  updated_at: string
}

export interface AdminUser {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'viewer'
  organization_id: string
  created_at: string
  last_login?: string
}

export interface ConfigAuditLog {
  id: string
  admin_user_id: string
  table_name: string
  record_id: string
  action: 'create' | 'update' | 'delete'
  old_value?: Record<string, any>
  new_value?: Record<string, any>
  created_at: string
}