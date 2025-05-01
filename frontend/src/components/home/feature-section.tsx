import { Brain, Calendar, ShoppingBag } from "lucide-react";

export default function FeatureSection() {
  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Recommendations",
      description: "Our AI analyzes your preferences and provides personalized destination and activity suggestions tailored just for you."
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "Custom Itineraries",
      description: "Create detailed day-by-day travel plans with the perfect balance of activities, relaxation, and exploration."
    },
    {
      icon: <ShoppingBag className="h-6 w-6" />,
      title: "Seamless Booking",
      description: "Book flights, hotels, and activities directly through our platform with access to exclusive deals and offers."
    }
  ];

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-primary-600 font-semibold tracking-wide uppercase">How It Works</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Smart Travel Planning in Minutes
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Our AI-powered platform makes creating the perfect trip effortless.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature, index) => (
              <div key={index} className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    {feature.icon}
                  </div>
                  <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.title}</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
