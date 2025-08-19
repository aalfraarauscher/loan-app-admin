import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  Save, 
  Loader2,
  Building2,
  Palette,
  Phone,
  Mail,
  FileText,
  Image,
  DollarSign
} from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CURRENCY_OPTIONS = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling' },
  { code: 'RWF', symbol: 'FRw', name: 'Rwandan Franc' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'MXN', symbol: '$', name: 'Mexican Peso' },
];

const organizationSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  support_email: z.string().email().optional().or(z.literal('')),
  support_phone: z.string().optional(),
  terms_url: z.string().url().optional().or(z.literal('')),
  privacy_url: z.string().url().optional().or(z.literal('')),
  currency_code: z.string().min(3).max(3),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function Organization() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organization_name: '',
      primary_color: '',
      secondary_color: '',
      support_email: '',
      support_phone: '',
      terms_url: '',
      privacy_url: '',
      currency_code: 'USD',
    },
  });

  useEffect(() => {
    fetchOrganizationConfig();
  }, []);

  const fetchOrganizationConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organization_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentConfig(data);
        setLogoPreview(data.logo_url);
        form.reset({
          organization_name: data.organization_name || '',
          primary_color: data.primary_color || '',
          secondary_color: data.secondary_color || '',
          support_email: data.support_email || '',
          support_phone: data.support_phone || '',
          terms_url: data.terms_url || '',
          privacy_url: data.privacy_url || '',
          currency_code: data.currency_code || 'USD',
        });
        setSelectedCurrency(data.currency_code || 'USD');
      }
    } catch (err: any) {
      console.error('Error fetching config:', err);
      setError('Failed to load organization config');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return currentConfig?.logo_url || null;

    // Delete old logo if it exists and is from our bucket
    if (currentConfig?.logo_url && currentConfig.logo_url.includes('organization-logos')) {
      const oldPath = currentConfig.logo_url.split('organization-logos/')[1];
      if (oldPath) {
        await supabase.storage
          .from('organization-logos')
          .remove([oldPath]);
      }
    }

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-logos')
      .upload(filePath, logoFile, {
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('organization-logos')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: OrganizationFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const logoUrl = await uploadLogo();
      
      // Find the currency symbol for the selected code
      const currency = CURRENCY_OPTIONS.find(c => c.code === data.currency_code);
      const currency_symbol = currency?.symbol || '$';
      
      const configData = {
        ...data,
        logo_url: logoUrl,
        currency_symbol,
        updated_at: new Date().toISOString(),
      };

      if (currentConfig) {
        const { data: updatedData, error } = await supabase
          .from('organization_config')
          .update(configData)
          .eq('id', currentConfig.id)
          .select()
          .single();
        if (error) throw error;
        
        // Update local state with the returned data to ensure we have the latest
        if (updatedData) {
          setCurrentConfig(updatedData);
          setLogoPreview(updatedData.logo_url);
          // Also update the form with the new values to ensure sync
          form.reset({
            organization_name: updatedData.organization_name || '',
            primary_color: updatedData.primary_color || '',
            secondary_color: updatedData.secondary_color || '',
            support_email: updatedData.support_email || '',
            support_phone: updatedData.support_phone || '',
            terms_url: updatedData.terms_url || '',
            privacy_url: updatedData.privacy_url || '',
          });
        }
      } else {
        const { data: insertedData, error } = await supabase
          .from('organization_config')
          .insert([configData])
          .select()
          .single();

        if (error) throw error;
        
        // Update local state immediately with the returned data
        if (insertedData) {
          setCurrentConfig(insertedData);
          setLogoPreview(insertedData.logo_url);
          // Also update the form with the new values to ensure sync
          form.reset({
            organization_name: insertedData.organization_name || '',
            primary_color: insertedData.primary_color || '',
            secondary_color: insertedData.secondary_color || '',
            support_email: insertedData.support_email || '',
            support_phone: insertedData.support_phone || '',
            terms_url: insertedData.terms_url || '',
            privacy_url: insertedData.privacy_url || '',
          });
        }
      }

      setSuccess('Organization settings saved successfully!');
      // Don't reset the form - keep the saved values
      // fetchOrganizationConfig();
    } catch (err: any) {
      console.error('Error saving config:', err);
      setError(err.message || 'Failed to save organization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-muted-foreground">
          Configure your organization's branding and contact information
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Basic Information</CardTitle>
              </div>
              <CardDescription>
                Set your organization name and logo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="organization_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Organization" {...field} />
                    </FormControl>
                    <FormDescription>
                      This name will be displayed throughout the app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Organization Logo</FormLabel>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="relative group">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="h-20 w-20 object-contain rounded-lg border-2 border-border"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                        <Image className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/50">
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </div>
                </div>
                <FormDescription>
                  Recommended: Square image, at least 512x512px, max 2MB
                </FormDescription>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Brand Colors</CardTitle>
              </div>
              <CardDescription>
                Define your primary and secondary brand colors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="h-10 w-20 cursor-pointer"
                          />
                          <Input
                            {...field}
                            placeholder="#3B82F6"
                            className="flex-1 font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Main brand color used throughout the app
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondary_color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="color"
                            {...field}
                            className="h-10 w-20 cursor-pointer"
                          />
                          <Input
                            {...field}
                            placeholder="#8B5CF6"
                            className="flex-1 font-mono"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Accent color for highlights and CTAs
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Currency Settings</CardTitle>
              </div>
              <CardDescription>
                Set the default currency for loan amounts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currency_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        setSelectedCurrency(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code}>
                            <span className="font-mono mr-2">{currency.symbol}</span>
                            {currency.name} ({currency.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This currency will be used for all loan amounts in the app
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCurrency && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <strong>Preview:</strong>{' '}
                    {CURRENCY_OPTIONS.find(c => c.code === selectedCurrency)?.symbol}
                    10,000
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Contact Information</CardTitle>
              </div>
              <CardDescription>
                Provide support contact details for your users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="support_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Mail className="h-4 w-4 inline mr-2" />
                        Support Email
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="support@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Email address for customer support
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="support_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <Phone className="h-4 w-4 inline mr-2" />
                        Support Phone
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1 (555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Phone number for customer support
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Legal URLs</CardTitle>
              </div>
              <CardDescription>
                Links to your terms of service and privacy policy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="terms_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms of Service URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/terms"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to your terms and conditions document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="privacy_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Privacy Policy URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://example.com/privacy"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to your privacy policy document
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert variant="default">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}