import MainLayout from "@/components/layout/main-layout";
import HeroSection from "@/components/home/hero-section";
import FeatureSection from "@/components/home/feature-section";
import PopularDestinations from "@/components/home/popular-destinations";
import FlightDestinationsSection from "@/components/home/flight-destinations-section";
import AiTripSection from "@/components/home/ai-trip-section";
import Testimonials from "@/components/home/testimonials";
import CallToAction from "@/components/home/call-to-action";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Redirect admin users to the admin dashboard
  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  // If the user is an admin, don't render the home page content
  if (user && user.role === "admin") {
    return null; // Will redirect via the useEffect
  }

  return (
    <MainLayout>
      <HeroSection />
      <FeatureSection />
      <PopularDestinations />
      <FlightDestinationsSection />
      <AiTripSection />
      <Testimonials />
      <CallToAction isLoggedIn={!!user} />
    </MainLayout>
  );
}
