import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  BarChart3,
  Users,
  Map,
  MessageSquareText,
  Settings,
  PlusCircle,
  Brain,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Search,
  BellRing,
  User,
  Loader2,
  Check,
  X,
  Download,
  Share2,
} from "lucide-react";
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";

// Helper function to safely format price
function formatPrice(price: any): string {
  if (typeof price === 'number') {
    return price.toFixed(2);
  }
  if (typeof price === 'string') {
    const numPrice = parseFloat(price);
    return isNaN(numPrice) ? price : numPrice.toFixed(2);
  }
  return String(price || '0.00');
}

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user"
  });
  const { toast } = useToast();

  // Redirect if user is not logged in or not an admin
  useEffect(() => {
    if (!user) {
      navigate("/admin/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  interface UserStats {
    totalUsers: number;
    newUsersToday: number;
    activeSessions: number;
  }
  
  interface TripStats {
    totalTrips: number;
    newTripsToday: number;
  }
  
  interface DestinationStats {
    totalDestinations: number;
    mostPopular: string | null;
  }
  
  interface BookingStats {
    totalBookings: number;
    flightBookings: {
      total: number;
      byStatus: { status: string; count: number }[];
    };
    hotelBookings: {
      total: number;
      byStatus: { status: string; count: number }[];
    };
    pendingApprovals: number;
    recentBookings: {
      type: string;
      created_at: string;
      price: number;
      status: string;
    }[];
  }
  
  interface PendingBooking {
    id: number;
    user_username: string;
    user_email: string;
    created_at: string;
    price: number;
    status: string;
    approval_status: string;
    bookingType: string;
    
    // Flight specific
    airline?: string;
    flight_number?: string;
    departure_date?: string;
    
    // Hotel specific
    hotel_name?: string;
    check_in_date?: string;
    check_out_date?: string;
  }
  
  interface PendingBookingsData {
    flights: PendingBooking[];
    hotels: PendingBooking[];
  }
  
  interface SearchLog {
    id: number;
    user_id: number;
    user_username: string;
    search_type: string;
    query: string;
    search_params?: any;
    created_at: string;
    result_count: number;
  }

  const { data: userStats, isLoading: isLoadingUserStats } = useQuery<UserStats>({
    queryKey: ["/api/admin/stats/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });

  const { data: tripStats, isLoading: isLoadingTripStats } = useQuery<TripStats>({
    queryKey: ["/api/admin/stats/trips"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });

  const { data: destinationStats, isLoading: isLoadingDestinationStats } = useQuery<DestinationStats>({
    queryKey: ["/api/admin/stats/destinations"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });
  
  const { data: bookingStats, isLoading: isLoadingBookingStats } = useQuery<BookingStats>({
    queryKey: ["/api/admin/stats/bookings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin",
  });
  
  const { data: pendingBookings, isLoading: isLoadingPendingBookings } = useQuery<PendingBookingsData>({
    queryKey: ["/api/admin/bookings/pending"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "bookings",
  });
  
  const { data: searchLogs, isLoading: isLoadingSearchLogs } = useQuery<SearchLog[]>({
    queryKey: ["/api/admin/logs"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "searchLogs",
  });
  
  // Get all flight bookings for admin
  const { data: allFlightBookings, isLoading: isLoadingFlightBookings } = useQuery({
    queryKey: ["/api/admin/flight-bookings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "bookings",
  });
  
  // Get all hotel bookings for admin
  const { data: allHotelBookings, isLoading: isLoadingHotelBookings } = useQuery({
    queryKey: ["/api/admin/hotel-bookings"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "bookings",
  });
  
  // Use raw SQL endpoints for search analytics
  const { data: flightSearchLogs, isLoading: isLoadingFlightSearchLogs } = useQuery<SearchLog[]>({
    queryKey: ["/api/admin/analytics/flight-searches"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "searchLogs",
  });
  
  const { data: hotelSearchLogs, isLoading: isLoadingHotelSearchLogs } = useQuery<SearchLog[]>({
    queryKey: ["/api/admin/analytics/hotel-searches"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "searchLogs",
  });
  
  // Get search analytics statistics
  const { data: searchStats, isLoading: isLoadingSearchStats } = useQuery({
    queryKey: ["/api/admin/analytics/search-stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "searchLogs",
  });
  
  const { data: allUsers, isLoading: isLoadingAllUsers } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user && user.role === "admin" && activeMenuItem === "users",
  });
  
  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest("/api/admin/users", "POST", userData);
    },
    onSuccess: () => {
      toast({
        title: "User added successfully",
        description: `User ${newUser.username} has been created.`,
      });
      // Reset form and close dialog
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "user"
      });
      setAddUserDialogOpen(false);
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Booking approval mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      bookingType, 
      status 
    }: { 
      bookingId: number; 
      bookingType: string; 
      status: 'approved' | 'rejected' 
    }) => {
      return await apiRequest(
        `/api/admin/bookings/${bookingType}/${bookingId}/status`, 
        "PUT", 
        { status }
      );
    },
    onSuccess: () => {
      toast({
        title: "Booking status updated",
        description: "The booking status has been updated successfully.",
      });
      // Invalidate bookings queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update booking status",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      return await apiRequest(`/api/admin/users/${userId}`, "DELETE");
    },
    onSuccess: () => {
      toast({
        title: "User deleted successfully",
        description: "The user has been removed from the system.",
      });
      // Invalidate users query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleAddUser = () => {
    // Basic validation
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    addUserMutation.mutate(newUser);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/admin/login");
  };

  if (!user || isLoadingUserStats || isLoadingTripStats || isLoadingDestinationStats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "bookings", label: "Booking Management", icon: <BellRing className="h-5 w-5" /> },
    { id: "users", label: "User Management", icon: <Users className="h-5 w-5" /> },
    { id: "destinations", label: "Destinations", icon: <Map className="h-5 w-5" /> },
    { id: "itineraries", label: "Itineraries", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "searchLogs", label: "Search History", icon: <Search className="h-5 w-5" /> },
    { id: "chat", label: "User Chat Logs", icon: <MessageSquareText className="h-5 w-5" /> },
    { id: "aiPrompts", label: "AI Settings", icon: <Brain className="h-5 w-5" /> },
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Modern design with gradient */}
      <div className="w-72 bg-slate-800 text-white flex flex-col shadow-md">
        <div className="p-6 border-b border-slate-700/30 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TripSage Admin</h1>
        </div>
        
        <div className="flex-1 py-4">
          <div className="px-4 mb-6">
            <div className="bg-slate-700/40 rounded-lg p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user.username}</p>
                <p className="text-xs opacity-70">{user.email}</p>
              </div>
            </div>
          </div>
          
          <nav className="px-4 space-y-1 max-h-[calc(100vh-280px)] overflow-hidden hover:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-4 py-3 text-sm rounded-lg transition-all duration-200 ${
                  activeMenuItem === item.id
                    ? "bg-slate-700 text-white shadow-sm border-l-4 border-blue-400"
                    : "text-white/80 hover:bg-slate-700/50 hover:text-white"
                }`}
                onClick={() => setActiveMenuItem(item.id)}
              >
                <span className="mr-3">
                  {item.icon}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-5 border-t border-slate-700/30">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2.5 text-sm rounded-lg text-white/80 hover:bg-slate-700/50 hover:text-white transition-all duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation - Modern with blur effect */}
        <header className="bg-white shadow-sm z-10 sticky top-0">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-semibold text-gray-800">
                {menuItems.find((item) => item.id === activeMenuItem)?.label}
              </h2>
              <div className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium hidden md:block">
                Admin Panel
              </div>
            </div>

            <div className="flex items-center space-x-5">
              <div className="relative hidden md:block">
                <Input
                  type="search"
                  placeholder="Search in admin panel..."
                  className="w-64 pl-10 py-2 rounded-lg border-gray-300 focus:border-blue-400 focus:ring focus:ring-blue-100 focus:ring-opacity-50"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <Button size="icon" variant="outline" className="rounded-full border-gray-300 hover:bg-gray-100 hover:text-gray-700">
                <BellRing className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 hover:text-gray-800">
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-700">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium hidden md:inline-block">{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-lg p-2">
                  <div className="px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="font-medium text-gray-800">{user.username}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuItem onClick={() => navigate("/admin/profile")} className="cursor-pointer rounded-md my-1 py-2">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/settings")} className="cursor-pointer rounded-md my-1 py-2">
                    <Settings className="h-4 w-4 mr-2 text-gray-500" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-slate-600 rounded-md my-1 py-2">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {activeMenuItem === "dashboard" && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back, {user.firstName || user.username}! Here's what's happening with your travel platform.</p>
              </div>
            
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                        <div className="text-3xl font-bold text-gray-800">{userStats?.totalUsers || 0}</div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs text-green-600 font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            {userStats?.newUsersToday || 0} today
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Total Trips</p>
                        <div className="text-3xl font-bold text-gray-800">{tripStats?.totalTrips || 0}</div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs text-green-600 font-medium flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                            {tripStats?.newTripsToday || 0} today
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Destinations</p>
                        <div className="text-3xl font-bold text-gray-800">{destinationStats?.totalDestinations || 0}</div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs text-blue-600 font-medium">
                            {destinationStats?.mostPopular ? `Top: ${destinationStats?.mostPopular}` : "No data"}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Map className="h-6 w-6 text-slate-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">Active Sessions</p>
                        <div className="text-3xl font-bold text-gray-800">{userStats?.activeSessions || 0}</div>
                        <div className="mt-1 flex items-center">
                          <span className="text-xs text-gray-500 font-medium">
                            Last hour activity
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <Users className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-7 mb-6">
                <Card className="md:col-span-4 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">User Growth Analytics</CardTitle>
                        <CardDescription className="text-gray-500">
                          User registrations and activity over time
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 gap-1 border-gray-300 text-gray-700">
                            Last 30 Days
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem>Last 7 Days</DropdownMenuItem>
                          <DropdownMenuItem>Last 30 Days</DropdownMenuItem>
                          <DropdownMenuItem>Last 90 Days</DropdownMenuItem>
                          <DropdownMenuItem>All Time</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 w-full rounded-lg bg-white p-4">
                      <div className="h-full w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { name: 'Mon', users: 15, sessions: 23 },
                              { name: 'Tue', users: 20, sessions: 28 },
                              { name: 'Wed', users: 25, sessions: 35 },
                              { name: 'Thu', users: 22, sessions: 32 },
                              { name: 'Fri', users: 28, sessions: 40 },
                              { name: 'Sat', users: 30, sessions: 45 },
                              { name: 'Sun', users: 35, sessions: 50 },
                            ]}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis 
                              dataKey="name" 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              tickLine={false}
                              axisLine={false}
                              tickFormatter={(value) => `${value}`}
                            />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <RechartsTooltip 
                              contentStyle={{ 
                                background: "white", 
                                border: "1px solid #E5E7EB",
                                borderRadius: "6px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 12, marginTop: 10 }} />
                            <Area 
                              type="monotone" 
                              dataKey="users" 
                              stroke="#4f46e5" 
                              fillOpacity={1} 
                              fill="url(#colorUsers)" 
                              name="Active Users"
                            />
                            <Area 
                              type="monotone" 
                              dataKey="sessions" 
                              stroke="#0ea5e9" 
                              fillOpacity={1} 
                              fill="url(#colorSessions)" 
                              name="Sessions"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="md:col-span-3 border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">Top Destinations</CardTitle>
                        <CardDescription className="text-gray-500">
                          Most popular travel destinations
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="gap-1 text-indigo-600">
                        View All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5">
                      {/* This would be populated with actual data */}
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center mr-4 shrink-0">
                          <span className="font-bold">P</span>
                        </div>
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-800">Paris, France</p>
                            <p className="text-sm font-medium text-slate-600">24%</p>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-slate-600 h-full rounded-full" style={{ width: "24%" }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center mr-4 shrink-0">
                          <span className="font-bold">T</span>
                        </div>
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-800">Tokyo, Japan</p>
                            <p className="text-sm font-medium text-slate-600">18%</p>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-slate-600 h-full rounded-full" style={{ width: "18%" }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-lg bg-slate-700 text-white flex items-center justify-center mr-4 shrink-0">
                          <span className="font-bold">N</span>
                        </div>
                        <div className="w-full">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium text-gray-800">New York, USA</p>
                            <p className="text-sm font-medium text-slate-600">14%</p>
                          </div>
                          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-slate-600 h-full rounded-full" style={{ width: "14%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-bold text-gray-800">Recent Bookings</CardTitle>
                    <CardDescription className="text-gray-500">
                      Latest travel arrangements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="space-y-0">
                      {bookingStats?.recentBookings && bookingStats.recentBookings.length > 0 ? (
                        bookingStats.recentBookings.slice(0, 4).map((booking, index) => (
                          <div key={index} className="py-3 px-6 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                  booking.type === 'flight' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                                }`}>
                                  {booking.type === 'flight' ? '✈️' : '🏨'}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-800">{booking.type.charAt(0).toUpperCase() + booking.type.slice(1)} Booking</p>
                                  <p className="text-xs text-gray-500">{new Date(booking.created_at).toLocaleDateString()}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium">${formatPrice(booking.price)}</p>
                                {booking.status === 'confirmed' ? (
                                  <span className="flex items-center text-xs font-medium text-white bg-green-500 py-1 px-2 rounded-full">
                                    <Check className="mr-1 h-3 w-3" />
                                    Confirmed
                                  </span>
                                ) : booking.status === 'rejected' ? (
                                  <span className="flex items-center text-xs font-medium text-white bg-red-500 py-1 px-2 rounded-full">
                                    <X className="mr-1 h-3 w-3" />
                                    Rejected
                                  </span>
                                ) : (
                                  <p className="text-xs font-medium text-amber-600">
                                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <p>No recent bookings to display</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 pb-3 border-t border-gray-100">
                    <Button variant="ghost" size="sm" className="w-full text-indigo-600">
                      View All Bookings
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 md:col-span-2">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-800">Trip Planning Analytics</CardTitle>
                        <CardDescription className="text-gray-500">
                          User preferences and planning trends
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 gap-1 border-gray-300 text-gray-700"
                          onClick={() => {
                            import('xlsx').then(XLSX => {
                              // Prepare data in a format suitable for Excel
                              const tripDurationData = [
                                ["Duration", "Percentage"],
                                ["1-3 days", 15],
                                ["4-7 days", 45],
                                ["8-14 days", 30],
                                ["14+ days", 10]
                              ];
                              
                              const budgetRangesData = [
                                ["Budget Range", "Percentage"],
                                ["Budget (≤$1000)", 25],
                                ["Mid-range ($1001-$3000)", 45],
                                ["Luxury ($3001-$5000)", 20],
                                ["Premium ($5000+)", 10]
                              ];
                              
                              // Create a new workbook with multiple sheets
                              const wb = XLSX.utils.book_new();
                              
                              // Create worksheets for each data set
                              const tripDurationWs = XLSX.utils.aoa_to_sheet(tripDurationData);
                              const budgetRangesWs = XLSX.utils.aoa_to_sheet(budgetRangesData);
                              
                              // Add the worksheets to the workbook
                              XLSX.utils.book_append_sheet(wb, tripDurationWs, "Trip Duration");
                              XLSX.utils.book_append_sheet(wb, budgetRangesWs, "Budget Ranges");
                              
                              // Generate Excel file and trigger download
                              XLSX.writeFile(wb, "trip-planning-analytics.xlsx");
                              
                              toast({
                                title: "Data exported",
                                description: "Trip planning analytics data has been exported as Excel file.",
                              });
                            }).catch(error => {
                              console.error("Error exporting to Excel:", error);
                              toast({
                                title: "Export failed",
                                description: "Unable to export data. Please try again.",
                                variant: "destructive",
                              });
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 px-3 gap-1 border-gray-300 text-gray-700"
                          onClick={() => {
                            // Create a sharable link logic
                            const shareableLink = `${window.location.origin}/admin/dashboard?view=analytics&t=${Date.now()}`;
                            
                            // Copy to clipboard
                            navigator.clipboard.writeText(shareableLink).then(() => {
                              toast({
                                title: "Link copied to clipboard",
                                description: "You can now share this analytics view with other admins.",
                              });
                            });
                          }}
                        >
                          <Share2 className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Popular Trip Duration</h3>
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">1-3 days</span>
                            <span className="text-xs font-medium">15%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full" style={{ width: "15%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">4-7 days</span>
                            <span className="text-xs font-medium">45%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: "45%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">8-14 days</span>
                            <span className="text-xs font-medium">30%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: "30%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">14+ days</span>
                            <span className="text-xs font-medium">10%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: "10%" }}></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4 bg-white">
                        <h3 className="text-sm font-medium text-gray-600 mb-1">Budget Ranges</h3>
                        <div className="space-y-2 mt-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Budget (≤$1000)</span>
                            <span className="text-xs font-medium">25%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-gray-500 h-full rounded-full" style={{ width: "25%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Mid-range ($1001-$3000)</span>
                            <span className="text-xs font-medium">45%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: "45%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Luxury ($3001-$5000)</span>
                            <span className="text-xs font-medium">20%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: "20%" }}></div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs">Premium ($5000+)</span>
                            <span className="text-xs font-medium">10%</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: "10%" }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeMenuItem === "users" && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">User Management</h3>
                <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account. User will receive login credentials via email.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={newUser.username}
                          onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                          placeholder="Enter username"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                          placeholder="Enter email address"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                          placeholder="Enter password"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                          value={newUser.role}
                          onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setAddUserDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleAddUser}
                        disabled={addUserMutation.isPending}
                      >
                        {addUserMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add User"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border rounded-lg">
                <div className="grid grid-cols-6 gap-4 p-4 border-b bg-slate-50 font-medium">
                  <div>ID</div>
                  <div>Username</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                
                {isLoadingAllUsers ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : allUsers && allUsers.length > 0 ? (
                  <div className="divide-y">
                    {allUsers.map((userItem) => (
                      <div key={userItem.id} className="grid grid-cols-6 gap-4 p-4 items-center">
                        <div>{userItem.id}</div>
                        <div>{userItem.username}</div>
                        <div>{userItem.email}</div>
                        <div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {userItem.role === "admin" ? "Admin" : "User"}
                          </span>
                        </div>
                        <div>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {userItem.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          {userItem.id !== user.id && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-red-500"
                              onClick={() => deleteUserMutation.mutate(userItem.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              {deleteUserMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No users found
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeMenuItem === "bookings" && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Booking Management</h3>
              </div>
              
              <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
                  <TabsTrigger value="flights">Flight Bookings</TabsTrigger>
                  <TabsTrigger value="hotels">Hotel Bookings</TabsTrigger>
                  <TabsTrigger value="history">Booking History</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pending">
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Flight Bookings</CardTitle>
                        <CardDescription>
                          Flight bookings waiting for admin approval
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPendingBookings || updateBookingStatusMutation.isPending ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : pendingBookings?.flights && pendingBookings.flights.length > 0 ? (
                          <div className="border rounded-lg overflow-x-auto">
                            <div className="min-w-[800px]">
                              <div className="grid grid-cols-7 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                                <div>User</div>
                                <div>Airline</div>
                                <div>Flight</div>
                                <div>Date</div>
                                <div>Price</div>
                                <div>Status</div>
                                <div>Actions</div>
                              </div>
                              <div className="divide-y">
                                {pendingBookings.flights.map((booking) => (
                                  <div key={booking.id} className="grid grid-cols-7 gap-2 p-3 items-center text-sm">
                                    <div className="truncate">{booking.user_username}</div>
                                    <div className="truncate">{booking.airline}</div>
                                    <div className="truncate">{booking.flight_number}</div>
                                    <div>{new Date(booking.departure_date || "").toLocaleDateString()}</div>
                                    <div>${formatPrice(booking.price)}</div>
                                    <div>
                                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                                        {booking.approval_status}
                                      </span>
                                    </div>
                                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-green-500 whitespace-nowrap"
                                        onClick={() => updateBookingStatusMutation.mutate({
                                          bookingId: booking.id,
                                          bookingType: 'flight',
                                          status: 'approved'
                                        })}
                                      >
                                        Approve
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-500 whitespace-nowrap"
                                        onClick={() => updateBookingStatusMutation.mutate({
                                          bookingId: booking.id,
                                          bookingType: 'flight',
                                          status: 'rejected'
                                        })}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 text-muted-foreground">
                            No pending flight bookings found
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Pending Hotel Bookings</CardTitle>
                        <CardDescription>
                          Hotel bookings waiting for admin approval
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingPendingBookings || updateBookingStatusMutation.isPending ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : pendingBookings?.hotels && pendingBookings.hotels.length > 0 ? (
                          <div className="border rounded-lg overflow-x-auto">
                            <div className="min-w-[800px]">
                              <div className="grid grid-cols-7 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                                <div>User</div>
                                <div>Hotel</div>
                                <div>Check-in</div>
                                <div>Check-out</div>
                                <div>Price</div>
                                <div>Status</div>
                                <div>Actions</div>
                              </div>
                              <div className="divide-y">
                                {pendingBookings.hotels.map((booking) => (
                                  <div key={booking.id} className="grid grid-cols-7 gap-2 p-3 items-center text-sm">
                                    <div className="truncate">{booking.user_username}</div>
                                    <div className="truncate">{booking.hotel_name}</div>
                                    <div>{new Date(booking.check_in_date || "").toLocaleDateString()}</div>
                                    <div>{new Date(booking.check_out_date || "").toLocaleDateString()}</div>
                                    <div>${formatPrice(booking.price)}</div>
                                    <div>
                                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs whitespace-nowrap">
                                        {booking.approval_status}
                                      </span>
                                    </div>
                                    <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-green-500 whitespace-nowrap"
                                        onClick={() => updateBookingStatusMutation.mutate({
                                          bookingId: booking.id,
                                          bookingType: 'hotel',
                                          status: 'approved'
                                        })}
                                      >
                                        Approve
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-red-500 whitespace-nowrap"
                                        onClick={() => updateBookingStatusMutation.mutate({
                                          bookingId: booking.id,
                                          bookingType: 'hotel',
                                          status: 'rejected'
                                        })}
                                      >
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-10 text-muted-foreground">
                            No pending hotel bookings found
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="flights">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Flight Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingFlightBookings ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : allFlightBookings && allFlightBookings.length > 0 ? (
                        <div className="border rounded-lg overflow-x-auto">
                          <div className="min-w-[900px]">
                            <div className="grid grid-cols-8 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                              <div>ID</div>
                              <div>User</div>
                              <div>Airline</div>
                              <div>Flight</div>
                              <div>Date</div>
                              <div>Price</div>
                              <div>Status</div>
                              <div>Actions</div>
                            </div>
                            <div className="divide-y">
                              {allFlightBookings.map((booking) => (
                                <div key={booking.id} className="grid grid-cols-8 gap-2 p-3 items-center text-sm">
                                  <div>{booking.id}</div>
                                  <div className="truncate">{booking.user_username}</div>
                                  <div className="truncate">{booking.airline}</div>
                                  <div>{booking.flight_number}</div>
                                  <div>{new Date(booking.departure_time).toLocaleDateString()}</div>
                                  <div>${formatPrice(booking.price)}</div>
                                  <div>
                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <div>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No flight bookings found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="hotels">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Hotel Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingHotelBookings ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : allHotelBookings && allHotelBookings.length > 0 ? (
                        <div className="border rounded-lg overflow-x-auto">
                          <div className="min-w-[900px]">
                            <div className="grid grid-cols-8 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                              <div>ID</div>
                              <div>User</div>
                              <div>Hotel</div>
                              <div>Check-in</div>
                              <div>Check-out</div>
                              <div>Price</div>
                              <div>Status</div>
                              <div>Actions</div>
                            </div>
                            <div className="divide-y">
                              {allHotelBookings.map((booking) => (
                                <div key={booking.id} className="grid grid-cols-8 gap-2 p-3 items-center text-sm">
                                  <div>{booking.id}</div>
                                  <div className="truncate">{booking.user_username}</div>
                                  <div className="truncate">{booking.hotel_name}</div>
                                  <div>{new Date(booking.check_in_date).toLocaleDateString()}</div>
                                  <div>{new Date(booking.check_out_date).toLocaleDateString()}</div>
                                  <div>${formatPrice(booking.price)}</div>
                                  <div>
                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {booking.status}
                                    </span>
                                  </div>
                                  <div>
                                    <Button variant="outline" size="sm">View Details</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No hotel bookings found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history">
                  <Card>
                    <CardHeader>
                      <CardTitle>Booking History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg">
                        <div className="grid grid-cols-7 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                          <div>ID</div>
                          <div>User</div>
                          <div>Type</div>
                          <div>Details</div>
                          <div>Date</div>
                          <div>Price</div>
                          <div>Status</div>
                        </div>
                        <div className="text-center py-10 text-muted-foreground">
                          No booking history found
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {activeMenuItem === "searchLogs" && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Search History Logs</h3>
              </div>
              
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Searches</TabsTrigger>
                  <TabsTrigger value="flight">Flight Searches</TabsTrigger>
                  <TabsTrigger value="hotel">Hotel Searches</TabsTrigger>
                  <TabsTrigger value="analytics">Search Analytics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Search Activity</CardTitle>
                      <CardDescription>
                        View recent search queries from all users
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingSearchLogs ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : searchLogs && searchLogs.length > 0 ? (
                        <div className="border rounded-lg overflow-x-auto">
                          <div className="min-w-[800px]">
                            <div className="grid grid-cols-7 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                              <div>ID</div>
                              <div>User</div>
                              <div>Type</div>
                              <div>Query</div>
                              <div>Results</div>
                              <div>Date</div>
                              <div>Actions</div>
                            </div>
                            <div className="divide-y">
                              {searchLogs.map((log) => (
                                <div key={log.id} className="grid grid-cols-7 gap-2 p-3 items-center text-sm">
                                  <div>{log.id}</div>
                                  <div className="truncate">{log.user_username}</div>
                                  <div>
                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${
                                      log.search_type === 'flight' 
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {log.search_type}
                                    </span>
                                  </div>
                                  <div className="truncate max-w-[150px]">{log.query}</div>
                                  <div>{log.result_count}</div>
                                  <div className="whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</div>
                                  <div>
                                    <Button variant="outline" size="sm">
                                      Details
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No search logs found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="flight">
                  <Card>
                    <CardHeader>
                      <CardTitle>Flight Search Activity</CardTitle>
                      <CardDescription>
                        Flight search patterns and popular routes
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingFlightSearchLogs ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : flightSearchLogs && flightSearchLogs.length > 0 ? (
                        <div className="border rounded-lg overflow-x-auto">
                          <div className="min-w-[750px]">
                            <div className="grid grid-cols-6 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                              <div>User</div>
                              <div>From/To</div>
                              <div>Date</div>
                              <div>Results</div>
                              <div>When</div>
                              <div>Actions</div>
                            </div>
                            <div className="divide-y">
                              {flightSearchLogs.map((log) => (
                                <div key={log.id} className="grid grid-cols-6 gap-2 p-3 items-center text-sm">
                                  <div className="truncate">{log.user_username}</div>
                                  <div className="truncate max-w-[150px]">{log.query}</div>
                                  <div className="whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</div>
                                  <div>{log.result_count}</div>
                                  <div className="whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</div>
                                  <div>
                                    <Button variant="outline" size="sm">Details</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No flight search logs found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="hotel">
                  <Card>
                    <CardHeader>
                      <CardTitle>Hotel Search Activity</CardTitle>
                      <CardDescription>
                        Hotel search patterns and popular destinations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingHotelSearchLogs ? (
                        <div className="flex justify-center py-10">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                      ) : hotelSearchLogs && hotelSearchLogs.length > 0 ? (
                        <div className="border rounded-lg overflow-x-auto">
                          <div className="min-w-[750px]">
                            <div className="grid grid-cols-6 gap-2 p-3 border-b bg-slate-50 font-medium text-sm">
                              <div>User</div>
                              <div>Location</div>
                              <div>Date</div>
                              <div>Results</div>
                              <div>When</div>
                              <div>Actions</div>
                            </div>
                            <div className="divide-y">
                              {hotelSearchLogs.map((log) => (
                                <div key={log.id} className="grid grid-cols-6 gap-2 p-3 items-center text-sm">
                                  <div className="truncate">{log.user_username}</div>
                                  <div className="truncate max-w-[150px]">{log.query}</div>
                                  <div className="whitespace-nowrap">{new Date(log.created_at).toLocaleDateString()}</div>
                                  <div>{log.result_count}</div>
                                  <div className="whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString()}</div>
                                  <div>
                                    <Button variant="outline" size="sm">Details</Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-10 text-muted-foreground">
                          No hotel search logs found
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Search Destinations</CardTitle>
                        <CardDescription>
                          Most frequently searched destinations
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingSearchStats ? (
                          <div className="h-80 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : searchStats?.popularTerms && searchStats.popularTerms.length > 0 ? (
                          <div className="h-80 overflow-auto">
                            <div className="space-y-2">
                              {searchStats.popularTerms.map((term: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-2 border rounded-lg">
                                  <div className="flex items-center">
                                    <span className="text-lg font-medium mr-3 text-gray-700">{index + 1}.</span>
                                    <div>
                                      <p className="font-medium text-gray-800">{term.search_term}</p>
                                      <p className="text-xs text-gray-500">Type: {term.search_type}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="mr-2 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                      {term.count} searches
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-80 flex items-center justify-center border rounded-md">
                            <p className="text-muted-foreground">No search data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Search Types Distribution</CardTitle>
                        <CardDescription>
                          Breakdown of search categories
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingSearchStats ? (
                          <div className="h-80 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : searchStats?.byType && searchStats.byType.length > 0 ? (
                          <div className="h-80 overflow-auto">
                            <div className="space-y-4">
                              {searchStats.byType.map((type: any, index: number) => (
                                <div key={index} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium capitalize">{type.search_type}</span>
                                    <span className="text-sm text-gray-500">{type.count} searches</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                      className="bg-blue-500 h-3 rounded-full"
                                      style={{ 
                                        width: `${Math.min(100, (type.count / Math.max(...searchStats.byType.map((t: any) => t.count))) * 100)}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-80 flex items-center justify-center border rounded-md">
                            <p className="text-muted-foreground">No search data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>Search Volume Over Time</CardTitle>
                        <CardDescription>
                          Search activity trends in the last 30 days
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingSearchStats ? (
                          <div className="h-80 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : searchStats?.volumeOverTime && searchStats.volumeOverTime.length > 0 ? (
                          <div className="h-80 border rounded-lg p-4">
                            <div className="text-center text-sm text-muted-foreground">
                              Volume chart visualization would display here with the time series data from the backend
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4">
                              {Array.from(new Set(searchStats.volumeOverTime.map((v: any) => v.search_type))).map((type: string, index: number) => (
                                <div key={index} className="bg-slate-50 p-3 rounded-lg">
                                  <div className="text-sm font-medium mb-1 capitalize">{type}</div>
                                  <div className="text-2xl font-bold text-blue-600">
                                    {searchStats.volumeOverTime
                                      .filter((v: any) => v.search_type === type)
                                      .reduce((sum: number, v: any) => sum + parseInt(v.count), 0)}
                                  </div>
                                  <div className="text-xs text-gray-500">total searches</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="h-80 flex items-center justify-center border rounded-md">
                            <p className="text-muted-foreground">No search volume data available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeMenuItem === "destinations" && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Destination Management</h3>
                <Button className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Destination
                </Button>
              </div>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All Destinations</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                  <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-0">
                        <div className="aspect-w-16 aspect-h-9 rounded-md overflow-hidden bg-slate-100 mb-2">
                          {/* Image would go here */}
                          <div className="flex items-center justify-center h-40 bg-slate-200">
                            <Map className="h-8 w-8 text-slate-400" />
                          </div>
                        </div>
                        <CardTitle>Paris, France</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          The City of Light draws millions of visitors every year with its unforgettable ambiance.
                        </p>
                        <div className="mt-2">
                          <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-500">Delete</Button>
                        </div>
                      </CardContent>
                    </Card>
                    {/* More destination cards would go here */}
                  </div>
                </TabsContent>
                <TabsContent value="popular">
                  <p>Popular destinations content</p>
                </TabsContent>
                <TabsContent value="trending">
                  <p>Trending destinations content</p>
                </TabsContent>
                <TabsContent value="seasonal">
                  <p>Seasonal destinations content</p>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* More content sections for other menu items would go here */}
        </main>
      </div>
    </div>
  );
}