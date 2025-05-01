import { Link } from "wouter";
import { Button } from "@/components/ui/button";

type CallToActionProps = {
  isLoggedIn: boolean;
};

export default function CallToAction({ isLoggedIn }: CallToActionProps) {
  return (
    <>
      {/* Traveler's Choice Awards Banner */}
      <section className="py-12 bg-amber-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="md:w-1/2 lg:w-2/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-amber-400 rounded-full p-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="font-bold text-black text-lg">Travelers' Choice</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-3">Awards Best of the Best</h2>
              <p className="text-gray-700 text-sm mb-6 max-w-md">
                Among our top 1% of places, stays, eats, and experiences—decided by you.
              </p>
              <Button className="rounded-full bg-black text-white border-black hover:bg-gray-800 px-6">
                See the winners
              </Button>
            </div>
            <div className="md:w-1/2 lg:w-3/5 relative">
              <div className="rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
                  alt="Traveler with backpack"
                  className="w-full object-cover aspect-[16/9]"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-green-500 hidden md:block"></div>
              <div className="absolute -bottom-4 left-10 w-12 h-12 rounded-full bg-amber-400 hidden md:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action section */}
      <section className="bg-gradient-to-r from-blue-900 to-indigo-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Plan Your Dream Trip?
            </h2>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of happy travelers who have discovered their perfect itineraries with TripSage.
            </p>
            <div className="mt-8 flex justify-center flex-wrap gap-4">
              <Link href={isLoggedIn ? "/trips/create" : "/auth"}>
                <Button
                  size="lg"
                  className="rounded-full px-8 bg-white text-blue-900 hover:bg-gray-100"
                >
                  {isLoggedIn ? "Create New Trip" : "Get Started For Free"}
                </Button>
              </Link>
              <Link href="/explore">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full px-8 text-white border-white hover:bg-white/10"
                >
                  Explore Destinations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
