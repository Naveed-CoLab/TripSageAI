import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      id: 1,
      name: "Sarah J.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
      rating: 5,
      text: "TripSage made planning our honeymoon so easy! The AI suggested places we'd never even thought of, and our trip to Bali was absolutely perfect. Every activity was exactly what we wanted."
    },
    {
      id: 2,
      name: "Michael T.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
      rating: 4.5,
      text: "As a solo traveler, I was worried about planning a complex trip across Europe. TripSage not only created a perfect itinerary but also found amazing deals on hotels and activities. Saved me hours of research!"
    },
    {
      id: 3,
      name: "Emily L.",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=100&q=80",
      rating: 5,
      text: "We used TripSage for our family vacation to Japan. The AI created a perfect balance of kid-friendly activities and cultural experiences. The booking process was seamless and everything went smoothly!"
    }
  ];

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex text-yellow-400">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
        {hasHalfStar && (
          <Star key="half" className="h-4 w-4 fill-current" style={{ clipPath: 'inset(0 50% 0 0)' }} />
        )}
        {[...Array(5 - fullStars - (hasHalfStar ? 1 : 0))].map((_, i) => (
          <Star key={`empty-${i}`} className="h-4 w-4" />
        ))}
      </div>
    );
  };

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">What Our Travelers Say</h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
            Real experiences from travelers who planned their dream trips with TripSage
          </p>
        </div>

        <div className="mt-12 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-gray-50 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <img 
                  className="h-12 w-12 rounded-full object-cover" 
                  src={testimonial.avatar} 
                  alt={testimonial.name} 
                />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
                  {renderStars(testimonial.rating)}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-gray-600 italic">
                  "{testimonial.text}"
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
