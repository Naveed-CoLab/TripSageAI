import MainLayout from "@/components/layout/main-layout";
import HeroSection from "@/components/home/hero-section";
import FeatureSection from "@/components/home/feature-section";
import PopularDestinations from "@/components/home/popular-destinations";
import FlightDestinationsSection from "@/components/home/flight-destinations-section";
import AiTripSection from "@/components/home/ai-trip-section";
import Testimonials from "@/components/home/testimonials";
import CallToAction from "@/components/home/call-to-action";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user } = useAuth();

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
