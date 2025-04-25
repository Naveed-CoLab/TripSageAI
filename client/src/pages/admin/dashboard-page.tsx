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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800 text-white flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold">TripSage Admin</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <nav className="px-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center w-full px-2 py-2 text-sm rounded-md ${
                  activeMenuItem === item.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
                onClick={() => setActiveMenuItem(item.id)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm rounded-md text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">
                {menuItems.find((item) => item.id === activeMenuItem)?.label}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search..."
                  className="w-64 pl-8"
                />
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              </div>

              <Button size="icon" variant="ghost">
                <BellRing className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>{user.username}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/admin/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/settings")}>
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4">
          {activeMenuItem === "dashboard" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Users
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userStats?.totalUsers || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{userStats?.newUsersToday || 0} today
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Trips
                    </CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{tripStats?.totalTrips || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      +{tripStats?.newTripsToday || 0} today
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Popular Destinations
                    </CardTitle>
                    <Map className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{destinationStats?.totalDestinations || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      {destinationStats?.mostPopular || "No data"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Sessions
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {userStats?.activeSessions || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active in the last hour
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>User Activity</CardTitle>
                    <CardDescription>
                      User registrations and activity over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80 flex items-center justify-center border rounded-md">
                      <p className="text-muted-foreground">Activity chart will appear here</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Top Destinations</CardTitle>
                    <CardDescription>
                      Most searched and planned destinations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* This would be populated with actual data */}
                      <div className="flex items-center">
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Paris, France</p>
                            <p className="text-sm text-muted-foreground">24%</p>
                          </div>
                          <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: "24%" }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Tokyo, Japan</p>
                            <p className="text-sm text-muted-foreground">18%</p>
                          </div>
                          <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: "18%" }}></div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">New York, USA</p>
                            <p className="text-sm text-muted-foreground">14%</p>
                          </div>
                          <div className="mt-1 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: "14%" }}></div>
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
                <Button className="flex items-center">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add User
                </Button>
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
                <div className="divide-y">
                  <div className="grid grid-cols-6 gap-4 p-4 items-center">
                    <div>1</div>
                    <div>admin</div>
                    <div>admin@example.com</div>
                    <div>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        Admin
                      </span>
                    </div>
                    <div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Active
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm" className="text-red-500">Block</Button>
                    </div>
                  </div>
                  {/* More user rows would go here */}
                </div>
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
                        {isLoadingPendingBookings ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : pendingBookings?.flights && pendingBookings.flights.length > 0 ? (
                          <div className="border rounded-lg">
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
                                  <div>{booking.user_username}</div>
                                  <div>{booking.airline}</div>
                                  <div>{booking.flight_number}</div>
                                  <div>{new Date(booking.departure_date || "").toLocaleDateString()}</div>
                                  <div>${booking.price?.toFixed(2)}</div>
                                  <div>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                      {booking.approval_status}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" className="text-green-500">Approve</Button>
                                    <Button variant="outline" size="sm" className="text-red-500">Reject</Button>
                                  </div>
                                </div>
                              ))}
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
                        {isLoadingPendingBookings ? (
                          <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : pendingBookings?.hotels && pendingBookings.hotels.length > 0 ? (
                          <div className="border rounded-lg">
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
                                  <div>{booking.user_username}</div>
                                  <div>{booking.hotel_name}</div>
                                  <div>{new Date(booking.check_in_date || "").toLocaleDateString()}</div>
                                  <div>{new Date(booking.check_out_date || "").toLocaleDateString()}</div>
                                  <div>${booking.price?.toFixed(2)}</div>
                                  <div>
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                      {booking.approval_status}
                                    </span>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" className="text-green-500">Approve</Button>
                                    <Button variant="outline" size="sm" className="text-red-500">Reject</Button>
                                  </div>
                                </div>
                              ))}
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
                      <div className="border rounded-lg">
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
                        <div className="text-center py-10 text-muted-foreground">
                          No flight bookings found
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="hotels">
                  <Card>
                    <CardHeader>
                      <CardTitle>All Hotel Bookings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-lg">
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
                        <div className="text-center py-10 text-muted-foreground">
                          No hotel bookings found
                        </div>
                      </div>
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