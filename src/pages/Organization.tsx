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
  AlertCircle, 
  Upload, 
  Save, 
  CheckCircle2, 
  Loader2,
  Building2,
  Palette,
  Phone,
  Mail,
  FileText,
  Image
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

const organizationSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  support_email: z.string().email().optional().or(z.literal('')),
  support_phone: z.string().optional(),
  terms_url: z.string().url().optional().or(z.literal('')),
  privacy_url: z.string().url().optional().or(z.literal('')),
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

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      organization_name: '',
      primary_color: '#3B82F6',
      secondary_color: '#8B5CF6',
      support_email: '',
      support_phone: '',
      terms_url: '',
      privacy_url: '',
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
          primary_color: data.primary_color || '#3B82F6',
          secondary_color: data.secondary_color || '#8B5CF6',
          support_email: data.support_email || '',
          support_phone: data.support_phone || '',
          terms_url: data.terms_url || '',
          privacy_url: data.privacy_url || '',
        });
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

    const fileExt = logoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('organization-assets')
      .upload(filePath, logoFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('organization-assets')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const onSubmit = async (data: OrganizationFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const logoUrl = await uploadLogo();
      
      const configData = {
        ...data,
        logo_url: logoUrl,
        updated_at: new Date().toISOString(),
      };

      if (currentConfig) {
        const { error } = await supabase
          .from('organization_config')
          .update(configData)
          .eq('id', currentConfig.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('organization_config')
          .insert([configData]);

        if (error) throw error;
      }

      setSuccess('Organization settings saved successfully!');
      fetchOrganizationConfig();
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
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <Button type="button" variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                  </label>
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
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {success}
              </AlertDescription>
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