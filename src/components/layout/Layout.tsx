import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { 
  LayoutDashboard, 
  Building2, 
  Palette, 
  Package,
  Webhook,
  Users,
  LogOut,
  Menu,
  ChevronLeft,
  Settings,
  User,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function Layout() {
  const { adminUser, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Organization', href: '/organization', icon: Building2 },
    { name: 'Theme', href: '/theme', icon: Palette },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Applications', href: '/applications', icon: FileText },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Integrations', href: '/integrations', icon: Webhook },
  ];

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col transition-all duration-300 border-r bg-card",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          {sidebarOpen && (
            <h1 className="text-xl font-bold">Loan Admin</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto"
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              !sidebarOpen && "rotate-180"
            )} />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? item.name : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {adminUser?.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {adminUser?.full_name || adminUser?.email}
                </p>
                <Badge variant={getRoleBadgeVariant(adminUser?.role || '')} className="text-xs">
                  {adminUser?.role?.replace('_', ' ')}
                </Badge>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className={cn(
                "flex-shrink-0",
                !sidebarOpen && "ml-0"
              )}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform md:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold">Loan Admin</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <Separator />

        <div className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {adminUser?.email?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {adminUser?.full_name || adminUser?.email}
              </p>
              <Badge variant={getRoleBadgeVariant(adminUser?.role || '')} className="text-xs">
                {adminUser?.role?.replace('_', ' ')}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-16 items-center gap-4 border-b px-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Loan Admin</h1>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}