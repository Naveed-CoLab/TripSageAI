
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import TripsPage from "@/pages/trips-page";

import TripDetailPage from "@/pages/trip-detail-page";
import DestinationDetailPage from "@/pages/destination-detail-page";
import ExplorePage from "@/pages/explore-page";
import ProfilePage from "@/pages/profile-page";
import FlightsPage from "@/pages/flights-page";
import FlightSearchPage from "@/pages/flight-search-page";
import FlightBookingPage from "@/pages/flight-booking-page";
import ProfileFlightsPage from "@/pages/profile-flights-page";
import ProfileHotelsPage from "@/pages/profile-hotels-page";
import WishlistPage from "@/pages/wishlist-page";
import BookingsPage from "@/pages/bookings-page";
import HotelsPage from "@/pages/hotels-page";
import HotelBookingPage from "@/pages/hotel-booking-page";
import AITripGeneratorPage from "@/pages/ai-trip/ai-trip-generator-page";
import AdminLoginPage from "@/pages/admin/login-page";
import DashboardPage from "@/pages/admin/dashboard-page";
import MapTestPage from "@/pages/map-test-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";

function Router() {
  return (
    <Switch>
      <Route path="/">
        <HomePage />
      </Route>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/trips" component={TripsPage} />
      <Route path="/trips/create" component={NotFound} />
      <ProtectedRoute path="/trips/:id" component={TripDetailPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/profile/flights" component={ProfileFlightsPage} />
      <ProtectedRoute path="/profile/hotels" component={ProfileHotelsPage} />
      <ProtectedRoute path="/bookings" component={BookingsPage} />
      <ProtectedRoute path="/wishlist" component={WishlistPage} />
      <Route path="/explore" component={ExplorePage} />
      <Route path="/destinations/:id" component={DestinationDetailPage} />
      <ProtectedRoute path="/flights" component={FlightsPage} />
      <ProtectedRoute path="/flights/search" component={FlightSearchPage} />
      <ProtectedRoute path="/flight-booking/:outboundId/:returnId?" component={FlightBookingPage} />
      <ProtectedRoute path="/hotels" component={HotelsPage} />
      <ProtectedRoute path="/hotel-booking" component={HotelBookingPage} />
      <ProtectedRoute path="/ai-trip-generator" component={AITripGeneratorPage} />
      <ProtectedRoute path="/map-test" component={MapTestPage} />
      
      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <AdminRoute path="/admin/dashboard" component={DashboardPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
