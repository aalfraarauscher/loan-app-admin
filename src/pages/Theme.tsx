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
  Save, 
  RefreshCw, 
  Palette,
  Type,
  Layout,
  Loader2,
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
  primary: '#007AFF',     // Blue - Main brand color for buttons and links
  secondary: '#34C759',   // Green - Accent color for highlights
  accent: '#34C759',      // Green - Success states and notifications
  background: '#FFFFFF',  // White - Main background color
  foreground: '#333333',  // Dark Gray - Main text color
  muted: '#F8F9FA',      // Light Gray - Subtle backgrounds and borders
  card: '#FFFFFF',       // White - Card and modal backgrounds
  destructive: '#FF3B30', // Red - Error states and warnings
  fontFamily: 'Inter, system-ui, sans-serif',
  headingSize: 2,
  bodySize: 1,
  borderRadius: 0.5,
};

const colorPresets = [
  {
    name: 'Default (iOS Style)',
    primary: '#007AFF',
    secondary: '#34C759',
    accent: '#34C759',
  },
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
        // Extract colors from the nested structure or use defaults
        const themeData = {
          primary: data.colors?.primary || defaultTheme.primary,
          secondary: data.colors?.secondary || defaultTheme.secondary,
          accent: data.colors?.success || data.colors?.accent || defaultTheme.accent,
          background: data.colors?.background?.primary || data.colors?.background || defaultTheme.background,
          foreground: data.colors?.text?.primary || data.colors?.foreground || defaultTheme.foreground,
          muted: data.colors?.background?.secondary || data.colors?.muted || defaultTheme.muted,
          card: data.colors?.background?.primary || data.colors?.card || defaultTheme.card,
          destructive: data.colors?.error || data.colors?.destructive || defaultTheme.destructive,
          fontFamily: data.typography?.fontFamily?.regular || data.typography?.fontFamily || defaultTheme.fontFamily,
          headingSize: data.typography?.fontSize?.xxl ? data.typography.fontSize.xxl / 24 : defaultTheme.headingSize,
          bodySize: data.typography?.fontSize?.md ? data.typography.fontSize.md / 14 : defaultTheme.bodySize,
          borderRadius: data.border_radius?.md ? data.border_radius.md / 8 : defaultTheme.borderRadius,
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
    console.log('Theme form submitted with data:', data);
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Create properly nested theme structure matching React Native app
      const themeData = {
        theme_name: 'Custom Theme',
        colors: {
          // Main colors
          primary: data.primary,
          primaryLight: data.primary,
          primaryDark: data.primary,
          secondary: data.secondary,
          secondaryLight: data.secondary,
          secondaryDark: data.secondary,
          success: data.accent,
          warning: '#FF9500',
          error: data.destructive,
          info: data.primary,
          white: '#FFFFFF',
          black: '#000000',
          gray: '#8E8E93',
          
          // Nested background object
          background: {
            primary: data.background,
            secondary: data.muted,
            tertiary: '#F5F5F7'
          },
          
          // Nested text object
          text: {
            primary: data.foreground,
            secondary: '#666666',
            tertiary: '#999999',
            disabled: '#C7C7CC',
            inverse: '#FFFFFF'
          },
          
          // Nested border object
          border: {
            primary: '#E5E5E7',
            secondary: '#E5E5E7',
            focus: data.primary,
            error: data.destructive
          }
        },
        typography: {
          fontFamily: {
            regular: data.fontFamily,
            medium: data.fontFamily,
            bold: data.fontFamily
          },
          fontSize: {
            xs: 10,
            sm: 12,
            md: 14,
            lg: 16,
            xl: 20,
            xxl: 24 * data.headingSize,
            xxxl: 32 * data.headingSize
          },
          fontWeight: {
            light: '300',
            normal: '400',
            medium: '500',
            semibold: '600',
            bold: '700'
          }
        },
        spacing: {
          xs: 4,
          sm: 8,
          md: 12,
          lg: 16,
          xl: 20,
          xxl: 24,
          xxxl: 32,
          huge: 48
        },
        border_radius: {
          sm: 4 * data.borderRadius,
          md: 8 * data.borderRadius,
          lg: 12 * data.borderRadius,
          xl: 16 * data.borderRadius,
          xxl: 20 * data.borderRadius,
          round: 9999
        },
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      if (currentTheme) {
        const { data: updatedData, error } = await supabase
          .from('app_theme')
          .update(themeData)
          .eq('id', currentTheme.id)
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with the returned data
        if (updatedData) {
          setCurrentTheme(updatedData);
        }
      } else {
        const { data: insertedData, error } = await supabase
          .from('app_theme')
          .insert([themeData])
          .select()
          .single();

        if (error) throw error;
        
        // Update local state with the returned data
        if (insertedData) {
          setCurrentTheme(insertedData);
        }
      }

      setSuccess('Theme settings saved successfully!');
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

      <Alert variant="info">
        <AlertDescription>
          <strong>Note:</strong> Currently, only <strong>Primary</strong> and <strong>Secondary</strong> colors 
          affect the mobile app appearance. Other settings are saved for future use. 
          Typography, spacing, and border radius use optimized defaults to ensure UI consistency.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-3">
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
                  {error}
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  {success}
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

      </div>
    </div>
  );
}