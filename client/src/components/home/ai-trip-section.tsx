import { Link } from "wouter";
import { BrainCircuit, Map, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AiTripSection() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              AI-Powered Trip Planning
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-gray-500">
              TripSage's cutting-edge AI technology learns your preferences and creates the perfect travel plan for you. No more hours of research or uncertainty.
            </p>
            <div className="mt-8 space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary-500 text-white">
                    <BrainCircuit className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Smart Recommendations</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Our AI learns your travel style and preferences to suggest destinations and activities you'll love.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary-500 text-white">
                    <Map className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Optimized Itineraries</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Balance your trip with the perfect mix of sightseeing, relaxation, and hidden gems.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary-500 text-white">
                    <Lightbulb className="h-6 w-6" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Personalized Content</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Receive custom travel tips, cultural insights, and local recommendations for an authentic experience.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Link href="/ai-trip-generator">
                <Button variant="link" className="text-primary-600 hover:text-primary-500 font-medium px-0">
                  Create your AI travel plan now <span aria-hidden="true">→</span>
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-10 lg:mt-0">
            <div className="bg-gray-100 rounded-xl overflow-hidden shadow-lg">
              <img 
                className="w-full" 
                src="https://images.unsplash.com/photo-1581095198933-01150a1b6a8d?ixlib=rb-1.2.1&auto=format&fit=crop&w=600&q=80" 
                alt="AI Trip Planning interface" 
              />
              <div className="p-6 bg-white">
                <h4 className="text-lg font-semibold mb-4">Your Custom Japan Adventure</h4>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">1</div>
                    <div className="ml-3">
                      <span className="font-medium">Tokyo</span>
                      <span className="text-gray-500 text-sm ml-2">3 days</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">2</div>
                    <div className="ml-3">
                      <span className="font-medium">Kyoto</span>
                      <span className="text-gray-500 text-sm ml-2">2 days</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">3</div>
                    <div className="ml-3">
                      <span className="font-medium">Osaka</span>
                      <span className="text-gray-500 text-sm ml-2">2 days</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm text-gray-500">Estimated Budget</span>
                      <span className="text-lg font-semibold">$2,450</span>
                    </div>
                    <Link href="/ai-trip-generator?destination=Japan">
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
