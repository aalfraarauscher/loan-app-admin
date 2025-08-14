import { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Download, 
  MoreVertical,
  UserCheck,
  Calendar,
  Activity,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Filter,
  RefreshCw,
  Eye,
  Send,
  User,
  Shield,
  Clock,
  CreditCard,
  Loader2,
  Bell
} from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const navigate = useNavigate();
  const { users, loading, error, stats, filters, setFilters, exportToCSV, refreshUsers } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const debounceTimer = setTimeout(() => {
      setFilters({ ...filters, search: value });
    }, 300);
    return () => clearTimeout(debounceTimer);
  };

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display
    if (phone.startsWith('+')) {
      return phone;
    }
    return `+${phone}`;
  };

  const getActivityStatus = (lastApplicationDate?: string) => {
    if (!lastApplicationDate) return { label: 'No activity', variant: 'outline' as const };
    
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - new Date(lastApplicationDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceLastActivity === 0) return { label: 'Active today', variant: 'default' as const };
    if (daysSinceLastActivity <= 7) return { label: 'This week', variant: 'secondary' as const };
    if (daysSinceLastActivity <= 30) return { label: 'This month', variant: 'outline' as const };
    return { label: 'Inactive', variant: 'outline' as const };
  };

  const handleViewDetails = (user: any) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleViewApplications = (userId: string) => {
    // Navigate to applications page with user filter
    navigate(`/applications?user=${userId}`);
  };

  const handleSendNotification = (user: any) => {
    setSelectedUser(user);
    setNotificationTitle('');
    setNotificationMessage('');
    setNotificationOpen(true);
  };

  const sendNotification = async () => {
    if (!notificationTitle.trim() || !notificationMessage.trim()) {
      return;
    }

    setSendingNotification(true);
    // Simulate sending notification - in a real app, this would call an API
    setTimeout(() => {
      setSendingNotification(false);
      setNotificationOpen(false);
      setSuccessMessage(`Notification sent to ${selectedUser?.full_name || selectedUser?.phone_number}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage and monitor your application users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshUsers}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={loading || users.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.total_users}</div>
                <p className="text-xs text-muted-foreground">All registered users</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Verified</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.kyc_verified_users}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.total_users > 0 
                    ? `${Math.round((stats.kyc_verified_users / stats.total_users) * 100)}% verified`
                    : 'No users yet'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.users_this_month}</div>
                <p className="text-xs text-muted-foreground">Registered this month</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.active_today}</div>
                <p className="text-xs text-muted-foreground">Applied for loans today</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>
            View and manage all registered users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col gap-4 mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filters.kyc_status}
              onValueChange={(value: 'all' | 'verified' | 'unverified') => 
                setFilters({ ...filters, kyc_status: value })
              }
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="KYC Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="verified">KYC Verified</SelectItem>
                <SelectItem value="unverified">Not Verified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="mb-4 border-green-200 bg-green-50 text-green-900">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead className="text-center">Applications</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-40" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-8 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No users found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const activityStatus = getActivityStatus(user.last_application_date);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {user.full_name || 'Unnamed User'}
                            </p>
                            {user.gender && (
                              <p className="text-xs text-muted-foreground">
                                {user.gender}
                                {user.date_of_birth && ` • ${new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()} years`}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {formatPhoneNumber(user.phone_number)}
                            </div>
                            {user.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.kyc_verified ? 'default' : 'secondary'}>
                            {user.kyc_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{user.total_applications || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={activityStatus.variant}>
                            {activityStatus.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {format(new Date(user.created_at), 'MMM d, yyyy')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(user.created_at), 'h:mm a')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleViewDetails(user)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewApplications(user.id)}>
                                <FileText className="mr-2 h-4 w-4" />
                                View Applications
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendNotification(user)}>
                                <Bell className="mr-2 h-4 w-4" />
                                Send Notification
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination info */}
          {!loading && users.length > 0 && (
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Complete information about the user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              {/* User Info Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {selectedUser.full_name || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{formatPhoneNumber(selectedUser.phone_number)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {selectedUser.email || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">
                      {selectedUser.gender || 'Not provided'}
                    </p>
                  </div>
                  {selectedUser.date_of_birth && (
                    <div>
                      <p className="text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">
                        {format(new Date(selectedUser.date_of_birth), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedUser.date_of_birth && (
                    <div>
                      <p className="text-muted-foreground">Age</p>
                      <p className="font-medium">
                        {new Date().getFullYear() - new Date(selectedUser.date_of_birth).getFullYear()} years
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* KYC Status Section */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Verification Status
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">KYC Status</p>
                    <Badge variant={selectedUser.kyc_verified ? 'default' : 'secondary'}>
                      {selectedUser.kyc_verified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                  {selectedUser.kyc_submitted_at && (
                    <div>
                      <p className="text-muted-foreground">KYC Submitted</p>
                      <p className="font-medium">
                        {format(new Date(selectedUser.kyc_submitted_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Application Activity */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Application Activity
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Applications</p>
                    <p className="font-medium text-lg">
                      {selectedUser.total_applications || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approved Applications</p>
                    <p className="font-medium text-lg">
                      {selectedUser.approved_applications || 0}
                    </p>
                  </div>
                  {selectedUser.last_application_date && (
                    <div>
                      <p className="text-muted-foreground">Last Application</p>
                      <p className="font-medium">
                        {format(new Date(selectedUser.last_application_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                  {selectedUser.total_loan_amount && (
                    <div>
                      <p className="text-muted-foreground">Total Loan Amount</p>
                      <p className="font-medium">
                        ${selectedUser.total_loan_amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Account Information */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Account Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{selectedUser.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Joined Date</p>
                    <p className="font-medium">
                      {format(new Date(selectedUser.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="font-medium">
                      {format(new Date(selectedUser.updated_at), 'MMM d, yyyy h:mm a')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Activity Status</p>
                    <Badge variant={getActivityStatus(selectedUser.last_application_date).variant}>
                      {getActivityStatus(selectedUser.last_application_date).label}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setDetailsOpen(false);
              handleViewApplications(selectedUser?.id);
            }}>
              View Applications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notificationOpen} onOpenChange={setNotificationOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Notification</DialogTitle>
            <DialogDescription>
              Send a push notification to {selectedUser?.full_name || selectedUser?.phone_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="notification-title">Notification Title</Label>
              <Input
                id="notification-title"
                placeholder="Enter notification title..."
                value={notificationTitle}
                onChange={(e) => setNotificationTitle(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="notification-message">Message</Label>
              <Textarea
                id="notification-message"
                placeholder="Enter your message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="mt-1 min-h-[100px]"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This notification will be sent as a push notification to the user's registered device.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNotificationOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendNotification}
              disabled={sendingNotification || !notificationTitle.trim() || !notificationMessage.trim()}
            >
              {sendingNotification ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}