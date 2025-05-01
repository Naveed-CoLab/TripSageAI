import { Route, Switch, Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Add your page imports and routes here
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b shadow-sm z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="text-primary font-bold text-xl flex items-center">
            TravelAdvisor
          </Link>
          
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/dashboard" className="text-gray-600 hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/trips" className="text-gray-600 hover:text-primary">
                  My Trips
                </Link>
                <Link href="/wishlist" className="text-gray-600 hover:text-primary">
                  Wishlist
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary"
                >
                  Logout
                </button>
                <Link href="/profile" className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth" className="text-gray-600 hover:text-primary">
                  Login
                </Link>
                <Link href="/auth" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90">
                  Sign Up
                </Link>
              </>
            )}
          </div>
          
          <button 
            className="md:hidden text-gray-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            Menu
          </button>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white pb-4 px-4">
            <div className="flex flex-col space-y-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-gray-600 py-2 border-b">
                    Dashboard
                  </Link>
                  <Link href="/trips" className="text-gray-600 py-2 border-b">
                    My Trips
                  </Link>
                  <Link href="/wishlist" className="text-gray-600 py-2 border-b">
                    Wishlist
                  </Link>
                  <Link href="/profile" className="text-gray-600 py-2 border-b">
                    Profile
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-600 py-2 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth" className="text-gray-600 py-2 border-b">
                    Login
                  </Link>
                  <Link href="/auth" className="text-gray-600 py-2">
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-1">
        <Switch>
          {/* Define your routes here - for now just placeholder routes */}
          <Route path="/">
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">TravelAdvisor Home</h1>
              <p>Welcome to the TravelAdvisor App. This is the main page.</p>
            </div>
          </Route>
          <Route path="/auth">
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Authentication Page</h1>
              <p>Login or sign up page would go here.</p>
            </div>
          </Route>
          <ProtectedRoute path="/dashboard" component={() => (
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
              <p>Protected dashboard page.</p>
            </div>
          )} />
          <Route>
            <div className="container mx-auto p-4">
              <h1 className="text-2xl font-bold mb-4">Not Found</h1>
              <p>The page you're looking for doesn't exist.</p>
            </div>
          </Route>
        </Switch>
      </main>
      
      <footer className="bg-gray-50 border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-between">
            <div className="w-full md:w-1/3 mb-6 md:mb-0">
              <h3 className="font-bold mb-2">TravelAdvisor</h3>
              <p className="text-gray-600">Your AI-powered travel companion.</p>
            </div>
            <div className="w-full md:w-2/3 md:flex md:justify-end">
              <div className="md:w-1/3 mb-6 md:mb-0">
                <h4 className="font-bold mb-2">Links</h4>
                <ul className="space-y-2">
                  <li><Link href="/" className="text-gray-600 hover:text-primary">Home</Link></li>
                  <li><Link href="/about" className="text-gray-600 hover:text-primary">About</Link></li>
                </ul>
              </div>
              <div className="md:w-1/3 mb-6 md:mb-0">
                <h4 className="font-bold mb-2">Resources</h4>
                <ul className="space-y-2">
                  <li><Link href="/faq" className="text-gray-600 hover:text-primary">FAQ</Link></li>
                  <li><Link href="/help" className="text-gray-600 hover:text-primary">Help Center</Link></li>
                </ul>
              </div>
              <div className="md:w-1/3">
                <h4 className="font-bold mb-2">Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/privacy" className="text-gray-600 hover:text-primary">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-600 hover:text-primary">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-6 text-center text-gray-600">
            <p>&copy; {new Date().getFullYear()} TravelAdvisor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;