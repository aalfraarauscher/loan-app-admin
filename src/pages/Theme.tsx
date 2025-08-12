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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { 
  AlertCircle, 
  Save, 
  RefreshCw, 
  Palette,
  Type,
  Layout,
  Loader2,
  CheckCircle2,
  Smartphone,
  Eye,
  Sun,
  Moon
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
import { cn } from '@/lib/utils';

const themeSchema = z.object({
  primary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  secondary: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  accent: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  background: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  foreground: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  muted: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  card: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  destructive: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color'),
  fontFamily: z.string().min(1, 'Font family is required'),
  headingSize: z.number().min(1).max(4),
  bodySize: z.number().min(0.75).max(1.5),
  borderRadius: z.number().min(0).max(2),
});

type ThemeFormData = z.infer<typeof themeSchema>;

const defaultTheme: ThemeFormData = {
  primary: '#3B82F6',
  secondary: '#8B5CF6',
  accent: '#10B981',
  background: '#FFFFFF',
  foreground: '#1F2937',
  muted: '#F3F4F6',
  card: '#FFFFFF',
  destructive: '#EF4444',
  fontFamily: 'Inter, system-ui, sans-serif',
  headingSize: 2,
  bodySize: 1,
  borderRadius: 0.5,
};

const colorPresets = [
  {
    name: 'Blue Ocean',
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    accent: '#10B981',
  },
  {
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#EC4899',
    accent: '#FBBF24',
  },
  {
    name: 'Forest',
    primary: '#10B981',
    secondary: '#14B8A6',
    accent: '#84CC16',
  },
  {
    name: 'Monochrome',
    primary: '#6B7280',
    secondary: '#9CA3AF',
    accent: '#4B5563',
  },
];

export default function Theme() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const form = useForm<ThemeFormData>({
    resolver: zodResolver(themeSchema),
    defaultValues: defaultTheme,
  });

  const watchedValues = form.watch();

  useEffect(() => {
    fetchThemeConfig();
  }, []);

  const fetchThemeConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_theme')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setCurrentTheme(data);
        const themeData = {
          ...data.colors,
          fontFamily: data.typography?.fontFamily || defaultTheme.fontFamily,
          headingSize: parseFloat(data.typography?.headingSize) || defaultTheme.headingSize,
          bodySize: parseFloat(data.typography?.bodySize) || defaultTheme.bodySize,
          borderRadius: parseFloat(data.border_radius) || defaultTheme.borderRadius,
        };
        form.reset(themeData);
      }
    } catch (err: any) {
      console.error('Error fetching theme:', err);
      setError('Failed to load theme config');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ThemeFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const themeData = {
        theme_name: 'Custom Theme',
        colors: {
          primary: data.primary,
          secondary: data.secondary,
          accent: data.accent,
          background: data.background,
          foreground: data.foreground,
          muted: data.muted,
          card: data.card,
          destructive: data.destructive,
        },
        typography: {
          fontFamily: data.fontFamily,
          headingSize: `${data.headingSize}rem`,
          bodySize: `${data.bodySize}rem`,
        },
        spacing: {
          unit: 4,
          containerPadding: '1rem',
        },
        border_radius: `${data.borderRadius}rem`,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (currentTheme) {
        const { error } = await supabase
          .from('app_theme')
          .update(themeData)
          .eq('id', currentTheme.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('app_theme')
          .insert([themeData]);

        if (error) throw error;
      }

      setSuccess('Theme settings saved successfully!');
      fetchThemeConfig();
    } catch (err: any) {
      console.error('Error saving theme:', err);
      setError(err.message || 'Failed to save theme settings');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    form.reset(defaultTheme);
  };

  const applyPreset = (preset: typeof colorPresets[0]) => {
    form.setValue('primary', preset.primary);
    form.setValue('secondary', preset.secondary);
    form.setValue('accent', preset.accent);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[600px]" />
          <Skeleton className="h-[600px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Customization</h1>
        <p className="text-muted-foreground">
          Customize the app's visual appearance and branding
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="colors" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4 mr-2" />
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="typography">
                    <Type className="h-4 w-4 mr-2" />
                    Typography
                  </TabsTrigger>
                  <TabsTrigger value="layout">
                    <Layout className="h-4 w-4 mr-2" />
                    Layout
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="colors" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Color Presets</CardTitle>
                      <CardDescription>
                        Quick start with a predefined color scheme
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {colorPresets.map((preset) => (
                          <Button
                            key={preset.name}
                            type="button"
                            variant="outline"
                            className="h-auto p-4 justify-start"
                            onClick={() => applyPreset(preset)}
                          >
                            <div className="flex items-center gap-2 mr-3">
                              <div 
                                className="h-4 w-4 rounded-full border"
                                style={{ backgroundColor: preset.primary }}
                              />
                              <div 
                                className="h-4 w-4 rounded-full border"
                                style={{ backgroundColor: preset.secondary }}
                              />
                              <div 
                                className="h-4 w-4 rounded-full border"
                                style={{ backgroundColor: preset.accent }}
                              />
                            </div>
                            <span className="font-medium">{preset.name}</span>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Custom Colors</CardTitle>
                      <CardDescription>
                        Fine-tune your color palette
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="primary"
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
                                Main brand color for buttons and links
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="secondary"
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
                                Accent color for highlights
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="accent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Accent Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#10B981"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Success states and notifications
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="destructive"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Destructive Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#EF4444"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Error states and warnings
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="background"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Background Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#FFFFFF"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Main background color
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="foreground"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Foreground Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#1F2937"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Main text color
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="muted"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Muted Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#F3F4F6"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Subtle backgrounds and borders
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="card"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Color</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="color"
                                    {...field}
                                    className="h-10 w-20 cursor-pointer"
                                  />
                                  <Input
                                    {...field}
                                    placeholder="#FFFFFF"
                                    className="flex-1 font-mono"
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Card and modal backgrounds
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="typography" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Font Settings</CardTitle>
                      <CardDescription>
                        Configure typography for your app
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Family</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Inter, system-ui, sans-serif"
                              />
                            </FormControl>
                            <FormDescription>
                              CSS font-family declaration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="headingSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heading Size ({field.value}rem)</FormLabel>
                            <FormControl>
                              <Slider
                                min={1}
                                max={4}
                                step={0.25}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Size of main headings
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bodySize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Body Size ({field.value}rem)</FormLabel>
                            <FormControl>
                              <Slider
                                min={0.75}
                                max={1.5}
                                step={0.125}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Size of body text
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="layout" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Layout Settings</CardTitle>
                      <CardDescription>
                        Adjust spacing and corner radius
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="borderRadius"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Border Radius ({field.value}rem)</FormLabel>
                            <FormControl>
                              <Slider
                                min={0}
                                max={2}
                                step={0.125}
                                value={[field.value]}
                                onValueChange={(value) => field.onChange(value[0])}
                                className="py-4"
                              />
                            </FormControl>
                            <FormDescription>
                              Corner radius for cards and buttons
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

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

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={resetToDefault}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reset to Default
                </Button>
                <Button type="submit" disabled={saving} size="lg">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Theme
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>

        <div className="lg:sticky lg:top-8 h-fit">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    <Eye className="h-5 w-5 inline mr-2" />
                    Live Preview
                  </CardTitle>
                  <CardDescription>
                    See your theme in action
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 border-b flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Mobile Preview</span>
                  </div>
                </div>
                
                <div 
                  className="p-6 space-y-4 min-h-[500px]"
                  style={{
                    backgroundColor: isDarkMode ? '#1F2937' : watchedValues.background,
                    color: isDarkMode ? '#F9FAFB' : watchedValues.foreground,
                    fontFamily: watchedValues.fontFamily,
                  }}
                >
                  <h2 
                    className="font-bold"
                    style={{
                      fontSize: `${watchedValues.headingSize}rem`,
                      color: isDarkMode ? '#F9FAFB' : watchedValues.foreground,
                    }}
                  >
                    Welcome Back!
                  </h2>
                  
                  <p style={{ fontSize: `${watchedValues.bodySize}rem` }}>
                    Your loan application dashboard
                  </p>

                  <div className="grid gap-3">
                    <button
                      className="px-4 py-2.5 font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: watchedValues.primary,
                        color: watchedValues.background,
                        borderRadius: `${watchedValues.borderRadius}rem`,
                      }}
                    >
                      Apply for Loan
                    </button>

                    <button
                      className="px-4 py-2.5 font-medium transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: watchedValues.secondary,
                        color: watchedValues.background,
                        borderRadius: `${watchedValues.borderRadius}rem`,
                      }}
                    >
                      View Products
                    </button>
                  </div>

                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: isDarkMode ? '#374151' : watchedValues.card,
                      borderRadius: `${watchedValues.borderRadius}rem`,
                      border: `1px solid ${isDarkMode ? '#4B5563' : watchedValues.muted}`,
                    }}
                  >
                    <h3 
                      className="font-semibold mb-2"
                      style={{ 
                        color: isDarkMode ? '#F9FAFB' : watchedValues.foreground,
                        fontSize: `${watchedValues.bodySize * 1.25}rem`,
                      }}
                    >
                      Quick Cash Loan
                    </h3>
                    <p style={{ 
                      color: isDarkMode ? '#D1D5DB' : watchedValues.foreground,
                      opacity: 0.8,
                      fontSize: `${watchedValues.bodySize}rem`,
                    }}>
                      Get approved in minutes with our instant loan service.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div 
                      className="p-3 text-center"
                      style={{
                        backgroundColor: watchedValues.accent,
                        color: watchedValues.background,
                        borderRadius: `${watchedValues.borderRadius}rem`,
                      }}
                    >
                      <p className="font-medium text-sm">Approved</p>
                    </div>

                    <div 
                      className="p-3 text-center"
                      style={{
                        backgroundColor: watchedValues.destructive,
                        color: watchedValues.background,
                        borderRadius: `${watchedValues.borderRadius}rem`,
                      }}
                    >
                      <p className="font-medium text-sm">Rejected</p>
                    </div>
                  </div>

                  <div 
                    className="p-4"
                    style={{
                      backgroundColor: isDarkMode ? '#4B5563' : watchedValues.muted,
                      borderRadius: `${watchedValues.borderRadius}rem`,
                    }}
                  >
                    <p style={{ 
                      color: isDarkMode ? '#F9FAFB' : watchedValues.foreground,
                      fontSize: `${watchedValues.bodySize}rem`,
                    }}>
                      Support: support@loanapp.com
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}