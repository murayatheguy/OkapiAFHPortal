/**
 * Contact Page - Get in touch with Okapi Care Network
 */

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Building2,
  Users,
  Loader2
} from "lucide-react";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "general",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll get back to you within 24 hours.",
    });

    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "general",
      message: ""
    });
    setIsSubmitting(false);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone",
      description: "Speak with our care advisors",
      value: "1-800-555-CARE",
      action: "tel:1-800-555-2273"
    },
    {
      icon: Mail,
      title: "Email",
      description: "Send us a message anytime",
      value: "support@okapicare.com",
      action: "mailto:support@okapicare.com"
    },
    {
      icon: Clock,
      title: "Hours",
      description: "When we're available",
      value: "Mon-Fri: 8am-6pm PST",
      action: null
    }
  ];

  const subjectOptions = [
    { value: "general", label: "General Inquiry", icon: MessageSquare },
    { value: "family", label: "I'm Looking for Care", icon: Users },
    { value: "owner", label: "I'm a Home Owner", icon: Building2 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-b from-plum-50 to-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Contact Us
          </h1>
          <p className="text-xl text-foreground/70 max-w-2xl mx-auto">
            Have questions about finding care? We're here to help.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method) => (
            <div
              key={method.title}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <method.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{method.title}</h3>
              <p className="text-sm text-foreground/60 mb-3">{method.description}</p>
              {method.action ? (
                <a
                  href={method.action}
                  className="text-primary font-medium hover:underline"
                >
                  {method.value}
                </a>
              ) : (
                <span className="text-foreground font-medium">{method.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-4">Send Us a Message</h2>
            <p className="text-foreground/70 mb-8">
              Fill out the form below and we'll get back to you within 24 hours.
              Whether you're a family looking for care or an AFH owner with questions,
              we're here to help.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">I am...</Label>
                  <select
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  >
                    {subjectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Your Message *</Label>
                <Textarea
                  id="message"
                  placeholder="How can we help you today?"
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* FAQ Quick Links */}
          <div className="bg-ivory rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">Common Questions</h3>
            <div className="space-y-4">
              <a href="/faq" className="block p-4 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <h4 className="font-medium text-foreground mb-1">How do I find the right AFH?</h4>
                <p className="text-sm text-foreground/60">
                  Use our matching tool or browse by city to find homes that meet your needs.
                </p>
              </a>
              <a href="/faq" className="block p-4 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <h4 className="font-medium text-foreground mb-1">Is Okapi free to use?</h4>
                <p className="text-sm text-foreground/60">
                  Yes, searching for care homes is completely free for families.
                </p>
              </a>
              <a href="/faq" className="block p-4 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <h4 className="font-medium text-foreground mb-1">How do I list my AFH?</h4>
                <p className="text-sm text-foreground/60">
                  AFH owners can claim and manage their listing through our Owner Portal.
                </p>
              </a>
              <a href="/faq" className="block p-4 bg-white rounded-xl hover:shadow-sm transition-shadow">
                <h4 className="font-medium text-foreground mb-1">How is your data sourced?</h4>
                <p className="text-sm text-foreground/60">
                  All listings come from official DSHS records and are regularly updated.
                </p>
              </a>
            </div>
            <a
              href="/faq"
              className="inline-flex items-center gap-2 text-primary font-medium mt-6 hover:underline"
            >
              View All FAQs
            </a>
          </div>
        </div>
      </div>

      {/* Map/Location Section */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-foreground/60 mb-2">
              <MapPin className="h-5 w-5" />
              <span>Serving all of Washington State</span>
            </div>
            <p className="text-foreground/50 text-sm">
              Okapi Care Network is a Washington-based company dedicated to helping
              families find quality Adult Family Home care across the state.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
