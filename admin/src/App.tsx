import { Route, Switch, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import AiTripsList from "./pages/ai-trips/ai-trips-list";
import AiTripDetail from "./pages/ai-trips/ai-trip-detail";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    // Close sidebar on mobile when changing routes
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [location]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Access Required</h1>
          <p className="text-gray-600 mb-6 text-center">
            You need to be logged in as an administrator to access this page.
          </p>
          <div className="flex justify-center">
            <Link href="/auth" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside 
        className={`bg-gray-900 text-white w-64 flex-shrink-0 fixed h-full z-20 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <div className="p-4 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold flex items-center">
            TravelAdvisor Admin
          </Link>
        </div>
        
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            <li>
              <Link href="/admin/dashboard" className={`flex items-center p-2 rounded-md ${location === '/admin/dashboard' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/admin/users" className={`flex items-center p-2 rounded-md ${location === '/admin/users' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Users
              </Link>
            </li>
            <li>
              <Link href="/admin/trips" className={`flex items-center p-2 rounded-md ${location === '/admin/trips' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Trips
              </Link>
            </li>
            <li>
              <Link href="/admin/bookings" className={`flex items-center p-2 rounded-md ${location === '/admin/bookings' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Bookings
              </Link>
            </li>
            <li>
              <Link href="/admin/analytics" className={`flex items-center p-2 rounded-md ${location === '/admin/analytics' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Analytics
              </Link>
            </li>
            <li>
              <Link href="/admin/ai-trips" className={`flex items-center p-2 rounded-md ${location.includes('/admin/ai-trips') ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                AI Trips
              </Link>
            </li>
            <li>
              <Link href="/admin/settings" className={`flex items-center p-2 rounded-md ${location === '/admin/settings' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`}>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="absolute bottom-0 w-full border-t border-gray-800 p-4">
          <button 
            onClick={handleLogout}
            className="flex items-center text-gray-300 hover:text-white w-full"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        <header className="bg-white border-b shadow-sm py-4 px-6 flex justify-between items-center">
          <button 
            className="md:hidden text-gray-600"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            Menu
          </button>
          
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">{user?.username}</span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user.username?.charAt(0).toUpperCase() || "A"}
            </div>
          </div>
        </header>
        
        <main className="flex-1 p-6 bg-gray-50 overflow-auto">
          <Switch>
            {/* Define your admin routes here - for now just placeholder routes */}
            <Route path="/admin" exact>
              <div className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm mb-1">Total Users</h3>
                    <p className="text-3xl font-bold">120</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm mb-1">Active Trips</h3>
                    <p className="text-3xl font-bold">42</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm mb-1">Bookings</h3>
                    <p className="text-3xl font-bold">85</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h3 className="text-gray-500 text-sm mb-1">Revenue</h3>
                    <p className="text-3xl font-bold">$12,450</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                  <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="border-b pb-3">
                      <p className="font-medium">New user registered</p>
                      <p className="text-sm text-gray-500">John Smith - 2 hours ago</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="font-medium">Trip created</p>
                      <p className="text-sm text-gray-500">Paris Summer Vacation - 3 hours ago</p>
                    </div>
                    <div className="border-b pb-3">
                      <p className="font-medium">Hotel booking confirmed</p>
                      <p className="text-sm text-gray-500">Grand Hotel Paris - 5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </Route>
            <Route path="/admin/dashboard">
              <div className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6">Dashboard Analytics</h1>
                <p>Detailed analytics would go here.</p>
              </div>
            </Route>
            <Route path="/admin/users">
              <div className="container mx-auto">
                <h1 className="text-2xl font-bold mb-6">User Management</h1>
                <p>User management interface would go here.</p>
              </div>
            </Route>
            
            {/* AI Trips Routes */}
            <Route path="/admin/ai-trips">
              <AiTripsList />
            </Route>
            
            <Route path="/admin/ai-trips/:id">
              <AiTripDetail />
            </Route>
            
            <Route>
              <div className="container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Not Found</h1>
                <p>The admin page you're looking for doesn't exist.</p>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export default App;