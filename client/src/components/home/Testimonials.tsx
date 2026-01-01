/**
 * Warm Premium Testimonials - Family stories section
 * Emotional, trustworthy design for caregivers
 */

import { Quote, Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Finding care for Mom was the hardest decision I've ever made. Okapi helped me compare homes without any pressure. She's now at a wonderful place where she's treated like family.",
    author: "Sarah M.",
    relation: "Daughter",
    location: "Seattle, WA",
    rating: 5,
  },
  {
    quote:
      "After Dad's stroke, we needed to find care quickly. Being able to call homes directly and schedule tours on our timeline made all the difference during such a stressful time.",
    author: "Michael T.",
    relation: "Son",
    location: "Tacoma, WA",
    rating: 5,
  },
  {
    quote:
      "I was overwhelmed by all the options until I found Okapi. Being able to see real photos, reviews, and inspection reports helped me find the perfect fit for Grandma.",
    author: "Jennifer R.",
    relation: "Granddaughter",
    location: "Bellevue, WA",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-plum-600 to-plum-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Trusted by Washington Families
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Real stories from families who found the right care for their loved ones
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-card hover:shadow-card-hover transition-shadow relative"
            >
              {/* Quote icon */}
              <Quote className="w-10 h-10 text-plum-100 absolute top-6 right-6" />

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-gold-400 text-gold-400" />
                ))}
              </div>

              {/* Quote text - larger for readability */}
              <p className="text-lg text-foreground/80 mb-6 leading-relaxed relative z-10">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-100">
                <div className="w-12 h-12 bg-plum-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary font-semibold text-lg">
                    {testimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-foreground text-lg">
                    {testimonial.author}
                  </div>
                  <div className="text-base text-foreground/60">
                    {testimonial.relation} · {testimonial.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
