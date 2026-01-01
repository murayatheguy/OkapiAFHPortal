/**
 * Testimonials - Family stories section
 */

import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "Finding care for Mom was the hardest decision I've ever made. Okapi helped me compare homes without the pressure. She's now at a wonderful place where she's treated like family.",
    author: "Sarah M.",
    relation: "Found care for her mother",
    location: "Seattle",
  },
  {
    quote: "After Dad's stroke, we needed to find care quickly. Being able to call homes directly and schedule tours on our timeline made all the difference during a stressful time.",
    author: "Michael T.",
    relation: "Found care for his father",
    location: "Tacoma",
  },
  {
    quote: "I was overwhelmed by all the options. Being able to see real photos and reviews helped me understand which homes were the best fit for Grandma.",
    author: "Jennifer R.",
    relation: "Found care for her grandmother",
    location: "Bellevue",
  },
];

export function Testimonials() {
  return (
    <section className="py-16 lg:py-20 bg-[#4C1D95]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Trusted by Washington families
          </h2>
          <p className="text-lg text-purple-200 max-w-2xl mx-auto">
            Real stories from families who found the right care
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 relative"
            >
              <Quote className="w-10 h-10 text-purple-100 absolute top-6 right-6" />

              <p className="text-gray-700 mb-6 relative z-10">
                "{testimonial.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-[#4C1D95] font-semibold">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.relation}</div>
                  <div className="text-sm text-gray-500">{testimonial.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
