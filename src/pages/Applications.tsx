import { useState } from 'react';
import { useApplications } from '@/hooks/useApplications';
import type { LoanApplication } from '@/hooks/useApplications';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Briefcase,
  FileText,
  AlertCircle,
  RefreshCw,
  ArrowUpDown,
  Loader2,
  Webhook,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function Applications() {
  const [searchParams] = useSearchParams();
  const userIdFilter = searchParams.get('user');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<LoanApplication | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<LoanApplication['status']>('pending');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const pageSize = 10;

  const {
    applications,
    loading,
    error: fetchError,
    totalCount,
    updateApplicationStatus,
    triggerWebhook,
    deleteApplication,
    refetch
  } = useApplications({
    status: statusFilter,
    searchTerm,
    sortBy,
    sortOrder,
    page: currentPage,
    pageSize,
    userId: userIdFilter
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusIcon = (status: LoanApplication['status']) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'disbursed':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: LoanApplication['status']): 'default' | 'destructive' | 'secondary' => {
    switch (status) {
      case 'approved':
        return 'secondary'; // Changed from 'success' which doesn't exist
      case 'rejected':
        return 'destructive';
      case 'disbursed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatusUpdate = async () => {
    if (!selectedApplication) return;

    setUpdatingStatus(true);
    setError('');
    setSuccess('');

    const result = await updateApplicationStatus(selectedApplication.id, newStatus);

    if (result.success) {
      setSuccess(`Application status updated to ${newStatus}`);
      setStatusUpdateOpen(false);
      setSelectedApplication(null);
    } else {
      setError(result.error || 'Failed to update status');
    }

    setUpdatingStatus(false);
  };

  const handleWebhookSend = async (application: LoanApplication) => {
    setSendingWebhook(true);
    setError('');
    setSuccess('');

    const result = await triggerWebhook(application.id);

    if (result.success) {
      setSuccess('Webhook sent successfully');
    } else {
      setError(result.error || 'Failed to send webhook');
    }

    setSendingWebhook(false);
  };

  const handleDelete = async (application: LoanApplication) => {
    if (!confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      return;
    }

    const result = await deleteApplication(application.id);

    if (result.success) {
      setSuccess('Application deleted successfully');
    } else {
      setError(result.error || 'Failed to delete application');
    }
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const openDetails = (application: LoanApplication) => {
    setSelectedApplication(application);
    setDetailsOpen(true);
  };

  const openStatusUpdate = (application: LoanApplication) => {
    setSelectedApplication(application);
    setNewStatus(application.status);
    setStatusUpdateOpen(true);
  };

  if (loading && applications.length === 0) {
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
          <h1 className="text-3xl font-bold tracking-tight">Loan Applications</h1>
          <p className="text-muted-foreground">
            {userIdFilter 
              ? `Showing applications for user ${userIdFilter.substring(0, 8)}...`
              : 'Manage and review all loan applications'}
          </p>
        </div>
        <div className="flex gap-2">
          {userIdFilter && (
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/applications'}
            >
              Clear Filter
            </Button>
          )}
          <Button variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {(error || fetchError) && (
        <Alert variant="destructive">
          <AlertDescription>{error || fetchError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Applications</CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="disbursed">Disbursed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('created_at')}
                      className="-ml-2"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('amount')}
                      className="-ml-2"
                    >
                      Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSort('status')}
                      className="-ml-2"
                    >
                      Status
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No applications found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p className="text-sm">{formatDate(application.created_at)}</p>
                          <p className="text-xs text-muted-foreground">
                            {application.id.substring(0, 8)}...
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {application.profiles?.full_name || 'Unknown User'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {application.profiles?.phone_number || application.phone_number}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(application.amount)}
                      </TableCell>
                      <TableCell>{application.purpose}</TableCell>
                      <TableCell>{application.term_months} months</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={getStatusVariant(application.status)}
                            className="gap-1"
                          >
                            {getStatusIcon(application.status)}
                            {application.status}
                          </Badge>
                          {application.webhook_sent && (
                            <Webhook className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {application.monthly_income
                          ? formatCurrency(application.monthly_income)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openDetails(application)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusUpdate(application)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleWebhookSend(application)}
                              disabled={sendingWebhook}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              Send Webhook
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(application)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8"
                      >
                        {page}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                  {totalPages > 5 && (
                    <Button
                      variant={currentPage === totalPages ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8"
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Full details of the loan application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge
                  variant={getStatusVariant(selectedApplication.status)}
                  className="gap-1 px-3 py-1"
                >
                  {getStatusIcon(selectedApplication.status)}
                  {selectedApplication.status.toUpperCase()}
                </Badge>
                {selectedApplication.webhook_sent && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Webhook className="h-4 w-4" />
                    Webhook sent {formatDateTime(selectedApplication.webhook_sent_at!)}
                  </div>
                )}
              </div>

              <Separator />

              {/* Applicant Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Applicant Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {selectedApplication.profiles?.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-medium">
                      {selectedApplication.profiles?.phone_number || selectedApplication.phone_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedApplication.profiles?.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">KYC Status</p>
                    <p className="font-medium">
                      {selectedApplication.profiles?.kyc_verified ? (
                        <span className="text-green-600">Verified</span>
                      ) : (
                        <span className="text-orange-600">Not Verified</span>
                      )}
                    </p>
                  </div>
                  {selectedApplication.profiles?.gender && (
                    <div>
                      <p className="text-muted-foreground">Gender</p>
                      <p className="font-medium capitalize">
                        {selectedApplication.profiles.gender}
                      </p>
                    </div>
                  )}
                  {selectedApplication.profiles?.date_of_birth && (
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {formatDate(selectedApplication.profiles.date_of_birth)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Loan Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Loan Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Loan Amount</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(selectedApplication.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Purpose</p>
                    <p className="font-medium">{selectedApplication.purpose}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Term</p>
                    <p className="font-medium">{selectedApplication.term_months} months</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Interest Rate</p>
                    <p className="font-medium">{selectedApplication.interest_rate}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Payment</p>
                    <p className="font-medium">
                      {formatCurrency(selectedApplication.monthly_payment)}
                    </p>
                  </div>
                  {selectedApplication.loan_purpose_details && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Purpose Details</p>
                      <p className="font-medium">{selectedApplication.loan_purpose_details}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Employment Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Employment Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employment Status</p>
                    <p className="font-medium capitalize">
                      {selectedApplication.employment_status || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Monthly Income</p>
                    <p className="font-medium">
                      {selectedApplication.monthly_income
                        ? formatCurrency(selectedApplication.monthly_income)
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Timestamps */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Timeline
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Application Date</p>
                    <p className="font-medium">
                      {formatDateTime(selectedApplication.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {formatDateTime(selectedApplication.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application ID */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Application ID: {selectedApplication.id}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            {selectedApplication && (
              <Button onClick={() => {
                setDetailsOpen(false);
                openStatusUpdate(selectedApplication);
              }}>
                Update Status
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this loan application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">
                  <span className="text-muted-foreground">Applicant:</span>{' '}
                  <span className="font-medium">
                    {selectedApplication.profiles?.full_name || 'Unknown'}
                  </span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Amount:</span>{' '}
                  <span className="font-medium">
                    {formatCurrency(selectedApplication.amount)}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm font-medium">New Status</label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value as LoanApplication['status'])}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="disbursed">Disbursed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newStatus !== selectedApplication.status && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This will change the status from{' '}
                    <Badge variant={getStatusVariant(selectedApplication.status)} className="mx-1">
                      {selectedApplication.status}
                    </Badge>
                    to
                    <Badge variant={getStatusVariant(newStatus)} className="mx-1">
                      {newStatus}
                    </Badge>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusUpdate}
              disabled={updatingStatus || newStatus === selectedApplication?.status}
            >
              {updatingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}