import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Webhook,
  Plus,
  Edit,
  Trash2,
  Save,
  TestTube,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Clock,
  Activity,
  Database,
  Zap,
  Code,
  FileJson,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface WebhookIntegration {
  id: string;
  name: string;
  description?: string;
  webhook_url: string;
  api_key?: string;
  headers?: Record<string, string>;
  method: 'POST' | 'PUT' | 'PATCH';
  is_active: boolean;
  retry_attempts: number;
  retry_delay_seconds: number;
  timeout_seconds: number;
  created_at: string;
  updated_at: string;
}

interface FieldMapping {
  id: string;
  integration_id: string;
  source_field: string;
  target_field: string;
  transformation?: string;
  default_value?: string;
  is_required: boolean;
  field_order: number;
}

interface WebhookLog {
  id: string;
  integration_id: string;
  loan_application_id?: string;
  request_url: string;
  request_method: string;
  request_headers?: Record<string, string>;
  request_body?: any;
  response_status?: number;
  response_headers?: Record<string, string>;
  response_body?: any;
  error_message?: string;
  execution_time_ms?: number;
  retry_count: number;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  created_at: string;
}

// Available source fields from loan_applications and profiles
const SOURCE_FIELDS = [
  { value: 'amount', label: 'Loan Amount', table: 'loan_applications' },
  { value: 'purpose', label: 'Loan Purpose', table: 'loan_applications' },
  { value: 'term_months', label: 'Term (Months)', table: 'loan_applications' },
  { value: 'duration_months', label: 'Duration (Months)', table: 'loan_applications' },
  { value: 'interest_rate', label: 'Interest Rate', table: 'loan_applications' },
  { value: 'monthly_payment', label: 'Monthly Payment', table: 'loan_applications' },
  { value: 'employment_status', label: 'Employment Status', table: 'loan_applications' },
  { value: 'monthly_income', label: 'Monthly Income', table: 'loan_applications' },
  { value: 'loan_purpose_details', label: 'Purpose Details', table: 'loan_applications' },
  { value: 'phone_number', label: 'Phone Number', table: 'loan_applications' },
  { value: 'profiles.full_name', label: 'Full Name', table: 'profiles' },
  { value: 'profiles.full_name.first', label: 'First Name', table: 'profiles' },
  { value: 'profiles.full_name.last', label: 'Last Name', table: 'profiles' },
  { value: 'profiles.phone_number', label: 'Phone (Profile)', table: 'profiles' },
  { value: 'profiles.email', label: 'Email', table: 'profiles' },
  { value: 'profiles.gender', label: 'Gender', table: 'profiles' },
  { value: 'profiles.date_of_birth', label: 'Date of Birth', table: 'profiles' },
  { value: 'static', label: 'Static Value', table: 'static' },
];

// Available transformations
const TRANSFORMATIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'split_first', label: 'Split First Name' },
  { value: 'split_last', label: 'Split Last Name' },
  { value: 'calculate_age', label: 'Calculate Age' },
  { value: 'append_months', label: 'Append " months"' },
  { value: 'generate_email', label: 'Generate Email' },
  { value: 'date_format', label: 'Format Date' },
];

// Validation schemas
const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  webhook_url: z.string().url('Must be a valid URL'),
  api_key: z.string().optional(),
  method: z.enum(['POST', 'PUT', 'PATCH']),
  retry_attempts: z.number().min(0).max(5),
  retry_delay_seconds: z.number().min(0).max(3600),
  timeout_seconds: z.number().min(1).max(300),
});

const fieldMappingSchema = z.object({
  source_field: z.string().min(1, 'Source field is required'),
  target_field: z.string().min(1, 'Target field is required'),
  transformation: z.string().optional(),
  default_value: z.string().optional(),
  is_required: z.boolean(),
});

type WebhookFormData = z.infer<typeof webhookSchema>;
type FieldMappingFormData = z.infer<typeof fieldMappingSchema>;

export default function Integrations() {
  const [integrations, setIntegrations] = useState<WebhookIntegration[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mappingDialogOpen, setMappingDialogOpen] = useState(false);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<WebhookIntegration | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<WebhookIntegration | null>(null);
  const [editingMapping, setEditingMapping] = useState<FieldMapping | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeTab, setActiveTab] = useState('integrations');
  const [testResult, setTestResult] = useState<any>(null);

  const form = useForm<WebhookFormData>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      name: '',
      description: '',
      webhook_url: '',
      api_key: '',
      method: 'POST',
      retry_attempts: 3,
      retry_delay_seconds: 60,
      timeout_seconds: 30,
    },
  });

  const mappingForm = useForm<FieldMappingFormData>({
    resolver: zodResolver(fieldMappingSchema),
    defaultValues: {
      source_field: '',
      target_field: '',
      transformation: 'none',
      default_value: '',
      is_required: false,
    },
  });

  useEffect(() => {
    fetchIntegrations();
    fetchLogs();
  }, []);

  useEffect(() => {
    if (selectedIntegration) {
      fetchFieldMappings(selectedIntegration.id);
    }
  }, [selectedIntegration]);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_integrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations(data || []);
      if (data && data.length > 0 && !selectedIntegration) {
        setSelectedIntegration(data[0]);
      }
    } catch (err: any) {
      console.error('Error fetching integrations:', err);
      setError('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const fetchFieldMappings = async (integrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('webhook_field_mappings')
        .select('*')
        .eq('integration_id', integrationId)
        .order('field_order', { ascending: true });

      if (error) throw error;
      setFieldMappings(data || []);
    } catch (err: any) {
      console.error('Error fetching field mappings:', err);
      setError('Failed to load field mappings');
    }
  };

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Error fetching logs:', err);
    }
  };

  const openAddDialog = () => {
    setEditingIntegration(null);
    form.reset({
      name: '',
      description: '',
      webhook_url: '',
      api_key: '',
      method: 'POST',
      retry_attempts: 3,
      retry_delay_seconds: 60,
      timeout_seconds: 30,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (integration: WebhookIntegration) => {
    setEditingIntegration(integration);
    form.reset({
      name: integration.name,
      description: integration.description || '',
      webhook_url: integration.webhook_url,
      api_key: integration.api_key || '',
      method: integration.method,
      retry_attempts: integration.retry_attempts,
      retry_delay_seconds: integration.retry_delay_seconds,
      timeout_seconds: integration.timeout_seconds,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: WebhookFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const integrationData = {
        ...data,
        headers: { 'Content-Type': 'application/json' },
        updated_at: new Date().toISOString(),
      };

      if (editingIntegration) {
        const { error } = await supabase
          .from('webhook_integrations')
          .update(integrationData)
          .eq('id', editingIntegration.id);

        if (error) throw error;
        setSuccess('Integration updated successfully!');
      } else {
        const { data: newIntegration, error } = await supabase
          .from('webhook_integrations')
          .insert([integrationData])
          .select()
          .single();

        if (error) throw error;
        setSuccess('Integration created successfully!');
        setSelectedIntegration(newIntegration);
      }

      setDialogOpen(false);
      fetchIntegrations();
    } catch (err: any) {
      console.error('Error saving integration:', err);
      setError(err.message || 'Failed to save integration');
    } finally {
      setSaving(false);
    }
  };

  const deleteIntegration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this integration? This will also delete all field mappings.')) return;

    try {
      const { error } = await supabase
        .from('webhook_integrations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Integration deleted successfully!');
      fetchIntegrations();
      if (selectedIntegration?.id === id) {
        setSelectedIntegration(null);
      }
    } catch (err: any) {
      console.error('Error deleting integration:', err);
      setError(err.message || 'Failed to delete integration');
    }
  };

  const toggleIntegrationStatus = async (integration: WebhookIntegration) => {
    try {
      const { error } = await supabase
        .from('webhook_integrations')
        .update({ is_active: !integration.is_active })
        .eq('id', integration.id);

      if (error) throw error;
      fetchIntegrations();
    } catch (err: any) {
      console.error('Error toggling integration status:', err);
      setError(err.message || 'Failed to update integration status');
    }
  };

  const testWebhook = async (integration: WebhookIntegration) => {
    setTesting(true);
    setTestResult(null);

    try {
      // Call the edge function to test the webhook (bypasses CORS)
      const { data, error } = await supabase.functions.invoke('test-webhook', {
        body: {
          integrationId: integration.id
        }
      });

      if (error) {
        throw error;
      }

      // Process the response from the edge function
      setTestResult({
        success: data.success,
        status: data.status || 0,
        statusText: data.statusText || (data.success ? 'Success' : 'Failed'),
        request: data.samplePayload ? {
          url: integration.webhook_url,
          method: integration.method,
          headers: integration.headers,
          body: data.samplePayload,
        } : undefined,
        response: data.response || data.error || 'Test completed',
        error: data.error,
      });

      if (data.success) {
        setSuccess(`Test webhook sent successfully! (${data.executionTime}ms)`);
      } else {
        setError(data.error || `Test webhook failed with status ${data.status}`);
      }
    } catch (err: any) {
      console.error('Error testing webhook:', err);
      setError(err.message || 'Failed to test webhook');
      setTestResult({
        success: false,
        error: err.message,
      });
    } finally {
      setTesting(false);
    }
  };

  const openMappingDialog = (mapping?: FieldMapping) => {
    if (mapping) {
      setEditingMapping(mapping);
      mappingForm.reset({
        source_field: mapping.source_field,
        target_field: mapping.target_field,
        transformation: mapping.transformation || 'none',
        default_value: mapping.default_value || '',
        is_required: mapping.is_required,
      });
    } else {
      setEditingMapping(null);
      mappingForm.reset({
        source_field: '',
        target_field: '',
        transformation: 'none',
        default_value: '',
        is_required: false,
      });
    }
    setMappingDialogOpen(true);
  };

  const onSubmitMapping = async (data: FieldMappingFormData) => {
    if (!selectedIntegration) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const mappingData = {
        ...data,
        transformation: data.transformation === 'none' ? null : data.transformation,
        integration_id: selectedIntegration.id,
        field_order: editingMapping?.field_order || fieldMappings.length,
        updated_at: new Date().toISOString(),
      };

      if (editingMapping) {
        const { error } = await supabase
          .from('webhook_field_mappings')
          .update(mappingData)
          .eq('id', editingMapping.id);

        if (error) throw error;
        setSuccess('Field mapping updated successfully!');
      } else {
        const { error } = await supabase
          .from('webhook_field_mappings')
          .insert([mappingData]);

        if (error) throw error;
        setSuccess('Field mapping created successfully!');
      }

      setMappingDialogOpen(false);
      fetchFieldMappings(selectedIntegration.id);
    } catch (err: any) {
      console.error('Error saving field mapping:', err);
      setError(err.message || 'Failed to save field mapping');
    } finally {
      setSaving(false);
    }
  };

  const deleteMapping = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field mapping?')) return;

    try {
      const { error } = await supabase
        .from('webhook_field_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Field mapping deleted successfully!');
      if (selectedIntegration) {
        fetchFieldMappings(selectedIntegration.id);
      }
    } catch (err: any) {
      console.error('Error deleting field mapping:', err);
      setError(err.message || 'Failed to delete field mapping');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
          <p className="text-muted-foreground">
            Configure webhook integrations and field mappings
          </p>
        </div>
        <Button onClick={openAddDialog} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Integration
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="integrations">
            <Webhook className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="mappings">
            <Database className="mr-2 h-4 w-4" />
            Field Mappings
          </TabsTrigger>
          <TabsTrigger value="logs">
            <Activity className="mr-2 h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {integrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No integrations yet</h3>
                <p className="text-muted-foreground mt-2">
                  Get started by creating your first webhook integration.
                </p>
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          integration.is_active ? "bg-green-100" : "bg-gray-100"
                        )}>
                          <Webhook className={cn(
                            "h-5 w-5",
                            integration.is_active ? "text-green-600" : "text-gray-600"
                          )} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{integration.name}</CardTitle>
                          {integration.description && (
                            <CardDescription>{integration.description}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={integration.is_active ? "success" : "secondary"}>
                          {integration.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Switch
                          checked={integration.is_active}
                          onCheckedChange={() => toggleIntegrationStatus(integration)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditDialog(integration)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => testWebhook(integration)}>
                              <TestTube className="mr-2 h-4 w-4" />
                              Test Webhook
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedIntegration(integration)}>
                              <Settings className="mr-2 h-4 w-4" />
                              Configure Mappings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => deleteIntegration(integration.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Webhook URL</p>
                        <p className="font-mono text-xs mt-1 break-all">{integration.webhook_url}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Method</p>
                        <Badge variant="outline" className="mt-1">{integration.method}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Retry Policy</p>
                        <p className="mt-1">
                          {integration.retry_attempts} attempts, {integration.retry_delay_seconds}s delay
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timeout</p>
                        <p className="mt-1">{integration.timeout_seconds} seconds</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Test Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? 'Success' : 'Failed'}
                    </span>
                    {testResult.status && (
                      <Badge variant="outline">
                        {testResult.status} {testResult.statusText}
                      </Badge>
                    )}
                  </div>
                  {testResult.request && (
                    <div>
                      <p className="text-sm font-medium mb-2">Request:</p>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto">
                        {JSON.stringify(testResult.request, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResult.response && (
                    <div>
                      <p className="text-sm font-medium mb-2">Response:</p>
                      <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto">
                        {typeof testResult.response === 'string' 
                          ? testResult.response 
                          : JSON.stringify(testResult.response, null, 2)}
                      </pre>
                    </div>
                  )}
                  {testResult.error && (
                    <Alert variant="destructive">
                      <AlertDescription>{testResult.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="mappings" className="space-y-4">
          {selectedIntegration ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Field Mappings</CardTitle>
                      <CardDescription>
                        Configure how loan application fields map to {selectedIntegration.name}
                      </CardDescription>
                    </div>
                    <Button onClick={() => openMappingDialog()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Mapping
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fieldMappings.length === 0 ? (
                    <div className="text-center py-8">
                      <FileJson className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium">No field mappings</h3>
                      <p className="text-muted-foreground mt-2">
                        Add field mappings to configure the webhook payload.
                      </p>
                      <Button onClick={() => openMappingDialog()} className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Field Mapping
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Source Field</TableHead>
                          <TableHead>Target Field</TableHead>
                          <TableHead>Transformation</TableHead>
                          <TableHead>Default Value</TableHead>
                          <TableHead>Required</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fieldMappings.map((mapping) => (
                          <TableRow key={mapping.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Database className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">{mapping.source_field}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="font-mono text-sm">{mapping.target_field}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {mapping.transformation && (
                                <Badge variant="outline">
                                  {TRANSFORMATIONS.find(t => t.value === mapping.transformation)?.label}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {mapping.default_value && (
                                <span className="text-sm text-muted-foreground">
                                  {mapping.default_value}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {mapping.is_required && (
                                <Badge variant="secondary">Required</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => openMappingDialog(mapping)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => deleteMapping(mapping.id)}
                                    className="text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Select an integration</h3>
                <p className="text-muted-foreground mt-2">
                  Choose an integration from the Integrations tab to configure field mappings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Webhook Logs</CardTitle>
                  <CardDescription>
                    View webhook execution history and debug issues
                  </CardDescription>
                </div>
                <Button variant="outline" onClick={fetchLogs}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No logs yet</h3>
                  <p className="text-muted-foreground mt-2">
                    Webhook execution logs will appear here.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Integration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {integrations.find(i => i.id === log.integration_id)?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              log.status === 'success' ? 'success' : 
                              log.status === 'failed' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.response_status && (
                            <Badge variant="outline">{log.response_status}</Badge>
                          )}
                          {log.error_message && (
                            <span className="text-sm text-destructive ml-2">
                              {log.error_message.substring(0, 50)}...
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.execution_time_ms && (
                            <span className="text-sm text-muted-foreground">
                              {log.execution_time_ms}ms
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              // Show log details in a modal
                              console.log('Log details:', log);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingIntegration ? 'Edit Integration' : 'Add New Integration'}
            </DialogTitle>
            <DialogDescription>
              Configure webhook integration settings
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My CRM Integration" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name for this integration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Sends loan applications to our CRM system..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook URL</FormLabel>
                    <FormControl>
                      <Input 
                        type="url" 
                        placeholder="https://api.example.com/webhook"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The endpoint that will receive the webhook payload
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="api_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key (optional)</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          type={showApiKey ? "text" : "password"}
                          placeholder="your-api-key-here"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setShowApiKey(!showApiKey)}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Will be sent as Bearer token and X-API-Key header
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTTP Method</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="PATCH">PATCH</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="retry_attempts"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retry Attempts</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="5"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="retry_delay_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Retry Delay (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="3600"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeout_seconds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeout (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          max="300"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingIntegration ? 'Update' : 'Create'} Integration
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Field Mapping Dialog */}
      <Dialog open={mappingDialogOpen} onOpenChange={setMappingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMapping ? 'Edit Field Mapping' : 'Add Field Mapping'}
            </DialogTitle>
            <DialogDescription>
              Map loan application fields to webhook payload
            </DialogDescription>
          </DialogHeader>

          <Form {...mappingForm}>
            <form onSubmit={mappingForm.handleSubmit(onSubmitMapping)} className="space-y-4">
              <FormField
                control={mappingForm.control}
                name="source_field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Field</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source field" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SOURCE_FIELDS.map((sourceField) => (
                          <SelectItem key={sourceField.value} value={sourceField.value}>
                            <span className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {sourceField.table}
                              </Badge>
                              {sourceField.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={mappingForm.control}
                name="target_field"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Field</FormLabel>
                    <FormControl>
                      <Input placeholder="fieldName" {...field} />
                    </FormControl>
                    <FormDescription>
                      Field name in the webhook payload
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={mappingForm.control}
                name="transformation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transformation (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TRANSFORMATIONS.map((transform) => (
                          <SelectItem key={transform.value} value={transform.value}>
                            {transform.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Apply a transformation to the value
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={mappingForm.control}
                name="default_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Value (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Default if empty" {...field} />
                    </FormControl>
                    <FormDescription>
                      Value to use if source field is empty
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={mappingForm.control}
                name="is_required"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Required Field</FormLabel>
                      <FormDescription>
                        Mark this field as required in the payload
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setMappingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingMapping ? 'Update' : 'Create'} Mapping
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}