import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Palette,
  Settings,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RecentActivity {
  id: string;
  type: 'product_created' | 'product_updated' | 'config_changed' | 'theme_updated' | 'application_submitted' | 'application_approved';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    totalLoanValue: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'config_changed',
      message: 'Organization settings updated',
      timestamp: 'Just now',
      status: 'success'
    },
    {
      id: '2',
      type: 'product_created',
      message: 'New loan product "Quick Cash" added',
      timestamp: '2 hours ago',
      status: 'info'
    },
    {
      id: '3',
      type: 'theme_updated',
      message: 'App theme colors customized',
      timestamp: 'Yesterday',
      status: 'success'
    }
  ]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const { count: productCount } = await supabase
        .from('loan_products')
        .select('*', { count: 'exact', head: true });

      const { count: activeProductCount } = await supabase
        .from('loan_products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: applicationCount } = await supabase
        .from('loan_applications')
        .select('*', { count: 'exact', head: true });

      const { count: pendingCount } = await supabase
        .from('loan_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedCount } = await supabase
        .from('loan_applications')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: loanAmounts } = await supabase
        .from('loan_applications')
        .select('amount')
        .in('status', ['approved', 'disbursed']);

      const totalLoanValue = loanAmounts?.reduce((sum, app) => sum + Number(app.amount), 0) || 0;

      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalProducts: productCount || 0,
        activeProducts: activeProductCount || 0,
        totalApplications: applicationCount || 0,
        pendingApplications: pendingCount || 0,
        approvedApplications: approvedCount || 0,
        totalLoanValue,
        totalUsers: userCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toFixed(0)}`;
  };

  const approvalRate = stats.totalApplications > 0 
    ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
    : 0;

  const statCards = [
    {
      title: 'Total Applications',
      value: stats.totalApplications,
      icon: TrendingUp,
      description: `${stats.pendingApplications} pending`,
      trend: { value: 28, isPositive: true }
    },
    {
      title: 'Loan Value',
      value: formatCurrency(stats.totalLoanValue),
      icon: DollarSign,
      description: 'Approved & disbursed',
      trend: { value: 15, isPositive: true }
    },
    {
      title: 'Approval Rate',
      value: `${approvalRate}%`,
      icon: CheckCircle2,
      description: `${stats.approvedApplications} approved`,
      trend: { value: approvalRate > 50 ? 5 : -5, isPositive: approvalRate > 50 }
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      description: 'Registered users',
      trend: { value: 12, isPositive: true }
    },
  ];

  const quickActions = [
    {
      title: 'Loan Applications',
      description: 'Review and manage applications',
      icon: FileText,
      href: '/applications',
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
    },
    {
      title: 'Loan Products',
      description: 'Manage product catalog',
      icon: Package,
      href: '/products',
      color: 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400'
    },
    {
      title: 'Organization Settings',
      description: 'Configure branding and company info',
      icon: Building2,
      href: '/organization',
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
    },
    {
      title: 'Theme Customization',
      description: 'Personalize app appearance',
      icon: Palette,
      href: '/theme',
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950 dark:text-orange-400'
    },
  ];

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch(type) {
      case 'product_created':
      case 'product_updated':
        return Package;
      case 'config_changed':
        return Settings;
      case 'theme_updated':
        return Palette;
      default:
        return Activity;
    }
  };

  const getActivityBadgeVariant = (status: RecentActivity['status']) => {
    switch(status) {
      case 'success':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'info':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your loan application system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {stat.description}
                      </p>
                      {stat.trend && stat.trend.value !== 0 && (
                        <div className={cn(
                          "flex items-center text-xs font-medium",
                          stat.trend.isPositive ? "text-green-600" : "text-red-600"
                        )}>
                          {stat.trend.isPositive ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {stat.trend.value}%
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => navigate(action.href)}
                >
                  <div className={cn("rounded-lg p-2 mr-4", action.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system events and changes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              return (
                <div key={activity.id}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-muted p-2">
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <Badge variant={getActivityBadgeVariant(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        {activity.timestamp}
                      </div>
                    </div>
                  </div>
                  {index < recentActivities.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>
            Current system status and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Database</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Authentication</p>
                <p className="text-sm text-muted-foreground">Operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">Storage</p>
                <p className="text-sm text-muted-foreground">75% Used</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}