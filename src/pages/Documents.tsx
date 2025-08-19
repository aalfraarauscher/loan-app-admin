import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import type { DocumentType } from '@/types';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  FileText,
  ChevronUp,
  ChevronDown,
  Info,
  Edit,
  Trash2,
  Save,
  Loader2,
  Clock,
  HardDrive,
  FileType,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const FILE_TYPE_OPTIONS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpg', label: 'JPG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'doc', label: 'DOC' },
  { value: 'docx', label: 'DOCX' },
  { value: 'xls', label: 'XLS' },
  { value: 'xlsx', label: 'XLSX' },
];

const documentTypeSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  description: z.string().optional(),
  instructions: z.string().optional(),
  file_types: z.array(z.string()).min(1, 'Select at least one file type'),
  max_size_mb: z.number().min(0.1, 'Size must be at least 0.1 MB').max(100, 'Size cannot exceed 100 MB'),
  validity_days: z.number().optional(),
});

type DocumentTypeFormData = z.infer<typeof documentTypeSchema>;

export default function Documents() {
  const {
    documentTypes,
    loading,
    error,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    toggleDocumentTypeStatus,
    reorderDocumentTypes,
  } = useDocumentTypes();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<DocumentType | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [success, setSuccess] = useState('');
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch organization ID
    const fetchOrganizationId = async () => {
      const { data, error } = await supabase
        .from('organization_config')
        .select('id')
        .limit(1)
        .single();
      
      if (!error && data) {
        setOrganizationId(data.id);
      }
    };
    
    fetchOrganizationId();
  }, []);

  const form = useForm<DocumentTypeFormData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      instructions: '',
      file_types: ['pdf'],
      max_size_mb: 10,
      validity_days: undefined,
    },
  });

  const openAddDialog = () => {
    setEditingDocument(null);
    form.reset({
      name: '',
      description: '',
      instructions: '',
      file_types: ['pdf'],
      max_size_mb: 10,
      validity_days: undefined,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (doc: DocumentType) => {
    setEditingDocument(doc);
    form.reset({
      name: doc.name,
      description: doc.description || '',
      instructions: doc.instructions || '',
      file_types: doc.file_types,
      max_size_mb: doc.max_size_mb,
      validity_days: doc.validity_days || undefined,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: DocumentTypeFormData) => {
    if (!organizationId) {
      return;
    }
    
    setSaving(true);
    setSuccess('');

    try {
      const documentData = {
        ...data,
        organization_id: organizationId,
        display_order: editingDocument?.display_order || documentTypes.length,
        is_active: true,
      };

      if (editingDocument) {
        const { error } = await updateDocumentType(editingDocument.id, documentData);
        if (error) throw new Error(error);
        setSuccess('Document type updated successfully!');
      } else {
        const { error } = await createDocumentType(documentData as any);
        if (error) throw new Error(error);
        setSuccess('Document type created successfully!');
      }

      setDialogOpen(false);
    } catch (err: any) {
      console.error('Error saving document type:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;

    const { error } = await deleteDocumentType(id);
    if (!error) {
      setSuccess('Document type deleted successfully!');
    }
  };

  const handleToggleStatus = async (doc: DocumentType) => {
    const { error } = await toggleDocumentTypeStatus(doc.id, !doc.is_active);
    if (!error) {
      setSuccess(`Document type ${!doc.is_active ? 'activated' : 'deactivated'} successfully!`);
    }
  };

  const moveDocument = async (doc: DocumentType, direction: 'up' | 'down') => {
    const currentIndex = documentTypes.findIndex(d => d.id === doc.id);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === documentTypes.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const reorderedDocs = [...documentTypes];
    const [movedDoc] = reorderedDocs.splice(currentIndex, 1);
    reorderedDocs.splice(newIndex, 0, movedDoc);

    const updates = reorderedDocs.map((d, index) => ({
      id: d.id,
      display_order: index,
    }));

    await reorderDocumentTypes(updates);
  };

  const filteredDocuments = documentTypes.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Document Types</h1>
          <p className="text-muted-foreground">
            Manage required documents for loan applications
          </p>
        </div>
        <Button onClick={openAddDialog} size="lg" disabled={!organizationId}>
          <Plus className="mr-2 h-4 w-4" />
          Add Document Type
        </Button>
      </div>

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

      {!organizationId && (
        <Alert>
          <AlertDescription>
            Please ensure an organization is configured before adding document types.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Types Overview</CardTitle>
              <CardDescription>
                {documentTypes.length} total types, {documentTypes.filter(d => d.is_active).length} active
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search document types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                {searchQuery ? 'No document types found' : 'No document types yet'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first document type.'}
              </p>
              {!searchQuery && organizationId && (
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Document Type
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Order</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>File Requirements</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc, index) => (
                  <TableRow key={doc.id} className={cn(!doc.is_active && "opacity-60")}>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveDocument(doc, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => moveDocument(doc, 'down')}
                          disabled={index === filteredDocuments.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        {doc.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {doc.description}
                          </div>
                        )}
                        {doc.instructions && (
                          <div className="flex items-start gap-1 mt-2">
                            <Info className="h-3 w-3 text-muted-foreground mt-0.5" />
                            <span className="text-xs text-muted-foreground">
                              {doc.instructions}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileType className="h-4 w-4 text-muted-foreground" />
                          <div className="flex gap-1">
                            {doc.file_types.map(type => (
                              <Badge key={type} variant="secondary" className="text-xs">
                                {type.toUpperCase()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Max {doc.max_size_mb} MB
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {doc.validity_days ? (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {doc.validity_days} days
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">No expiry</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={doc.is_active || false}
                        onCheckedChange={() => handleToggleStatus(doc)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => openEditDialog(doc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(doc)}>
                            {doc.is_active ? (
                              <>
                                <XCircle className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(doc.id)}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Edit Document Type' : 'Add New Document Type'}
            </DialogTitle>
            <DialogDescription>
              {editingDocument
                ? 'Update the details of this document type.'
                : 'Create a new document type that can be required for loan applications.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Bank Statement" {...field} />
                    </FormControl>
                    <FormDescription>
                      The name of the document as shown to applicants
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
                        placeholder="Recent bank statement showing account activity"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of what this document is
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions (optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please upload your most recent bank statement (last 3 months)"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Specific instructions for applicants on what to upload
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="file_types"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Accepted File Types</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {FILE_TYPE_OPTIONS.map(type => (
                            <label
                              key={type.value}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                value={type.value}
                                checked={field.value?.includes(type.value)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const value = e.target.value;
                                  if (checked) {
                                    field.onChange([...field.value, value]);
                                  } else {
                                    field.onChange(field.value.filter(v => v !== value));
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <span className="text-sm">{type.label}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormDescription>
                        Select all file types that are acceptable
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="max_size_mb"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum File Size (MB)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.1"
                          placeholder="10"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum allowed file size in megabytes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="validity_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Validity Period (days, optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="90"
                        {...field}
                        onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      How many days the document remains valid (leave empty for no expiry)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || !organizationId}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {editingDocument ? 'Update Document Type' : 'Create Document Type'}
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