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
  Edit,
  Trash2,
  Save,
  Package,
  MoreHorizontal,
  Loader2,
  DollarSign,
  Calendar,
  Percent,
  Clock,
  FileText,
  TrendingUp,
  Search,
  CheckCircle2,
} from 'lucide-react';
import type { LoanProduct } from '@/types';
import { cn } from '@/lib/utils';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  purpose: z.string().min(1, 'Purpose is required'),
  min_amount: z.number().positive('Minimum amount must be positive'),
  max_amount: z.number().positive('Maximum amount must be positive'),
  min_term_months: z.number().positive('Minimum term must be positive'),
  max_term_months: z.number().positive('Maximum term must be positive'),
  interest_rate: z.number().min(0, 'Interest rate must be non-negative'),
  processing_fee: z.number().min(0, 'Processing fee must be non-negative'),
  late_payment_fee: z.number().min(0, 'Late payment fee must be non-negative'),
  grace_period_months: z.number().min(0, 'Grace period must be non-negative'),
  icon_name: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function Products() {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      purpose: '',
      min_amount: 1000,
      max_amount: 50000,
      min_term_months: 6,
      max_term_months: 60,
      interest_rate: 10,
      processing_fee: 2,
      late_payment_fee: 5,
      grace_period_months: 1,
      icon_name: 'package',
    },
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      description: '',
      purpose: '',
      min_amount: 1000,
      max_amount: 50000,
      min_term_months: 6,
      max_term_months: 60,
      interest_rate: 10,
      processing_fee: 2,
      late_payment_fee: 5,
      grace_period_months: 1,
      icon_name: 'package',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (product: LoanProduct) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      purpose: product.purpose,
      min_amount: product.min_amount,
      max_amount: product.max_amount,
      min_term_months: product.min_term_months,
      max_term_months: product.max_term_months,
      interest_rate: product.interest_rate,
      processing_fee: product.processing_fee,
      late_payment_fee: product.late_payment_fee,
      grace_period_months: product.grace_period_months,
      icon_name: product.icon_name,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const productData = {
        ...data,
        eligibility_criteria: {},
        required_documents: [],
        is_active: true,
        display_order: editingProduct?.display_order || products.length,
        updated_at: new Date().toISOString(),
      };

      if (editingProduct) {
        const { error } = await supabase
          .from('loan_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;
        setSuccess('Product updated successfully!');
      } else {
        const { error } = await supabase
          .from('loan_products')
          .insert([productData]);

        if (error) throw error;
        setSuccess('Product created successfully!');
      }

      setDialogOpen(false);
      fetchProducts();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('loan_products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSuccess('Product deleted successfully!');
      fetchProducts();
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message || 'Failed to delete product');
    }
  };

  const toggleProductStatus = async (product: LoanProduct) => {
    try {
      const { error } = await supabase
        .from('loan_products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      fetchProducts();
    } catch (err: any) {
      console.error('Error toggling product status:', err);
      setError(err.message || 'Failed to update product status');
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.purpose.toLowerCase().includes(searchQuery.toLowerCase())
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
          <h1 className="text-3xl font-bold tracking-tight">Loan Products</h1>
          <p className="text-muted-foreground">
            Manage loan products and their parameters
          </p>
        </div>
        <Button onClick={openAddDialog} size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Add Product
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Products Overview</CardTitle>
              <CardDescription>
                {products.length} total products, {products.filter(p => p.is_active).length} active
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">
                {searchQuery ? 'No products found' : 'No products yet'}
              </h3>
              <p className="text-muted-foreground mt-2">
                {searchQuery 
                  ? 'Try adjusting your search terms' 
                  : 'Get started by creating your first loan product.'}
              </p>
              {!searchQuery && (
                <Button onClick={openAddDialog} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Amount Range</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Rates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className={cn(!product.is_active && "opacity-60")}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.description}
                        </div>
                        <Badge variant="outline" className="mt-1">
                          <FileText className="mr-1 h-3 w-3" />
                          {product.purpose}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            ${product.min_amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            to ${product.max_amount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {product.min_term_months} months
                          </div>
                          <div className="text-sm text-muted-foreground">
                            to {product.max_term_months} months
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {product.interest_rate}% p.a.
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Percent className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {product.processing_fee}% fee
                          </span>
                        </div>
                        {product.grace_period_months > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {product.grace_period_months}mo grace
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.is_active || false}
                        onCheckedChange={() => toggleProductStatus(product)}
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
                          <DropdownMenuItem onClick={() => openEditDialog(product)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleProductStatus(product)}>
                            {product.is_active ? (
                              <>
                                <Package className="mr-2 h-4 w-4" />
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
                            onClick={() => deleteProduct(product.id)}
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update the details of your loan product.'
                : 'Create a new loan product with specific parameters.'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Personal Loan" {...field} />
                      </FormControl>
                      <FormDescription>
                        Display name for the product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose</FormLabel>
                      <FormControl>
                        <Input placeholder="Personal expenses" {...field} />
                      </FormControl>
                      <FormDescription>
                        Primary use case for this loan
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Flexible personal loan for various needs..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Detailed description shown to users
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Loan Parameters</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="min_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Amount ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="50000"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_term_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Term (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="6"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_term_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Term (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="60"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fees & Charges</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (% per annum)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="10"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="processing_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Processing Fee (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="2"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="late_payment_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Late Payment Fee (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1"
                            placeholder="5"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grace_period_months"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grace Period (months)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="icon_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon Name (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="package" {...field} />
                    </FormControl>
                    <FormDescription>
                      Icon to display with this product
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                      {editingProduct ? 'Update Product' : 'Create Product'}
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