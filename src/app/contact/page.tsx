"use client";
import { useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";
import Button from "@/components/Button";
import { Mail, MapPin, Phone } from "lucide-react";
import { FaInstagram, FaFacebook, FaYoutube, FaSnapchat } from "react-icons/fa";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const text = `Hello 𝔽𝕒𝕙𝕒𝕟 𝕎𝕖𝕒𝕣,%0A
I want to contact you:%0A%0A
Name: ${formData.name}%0A
Email: ${formData.email}%0A
Message: ${formData.message}`;

    const phoneNumber = "918171423264"; // +91 without +
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${text}`;

    window.open(whatsappURL, "_blank");

    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <AnimatedSection>
        <h1 className="mb-16 text-center text-3xl font-light uppercase tracking-[0.3em]">
          Contact
        </h1>
      </AnimatedSection>

      <div className="grid gap-16 md:grid-cols-2">
        {/* FORM */}
        <AnimatedSection>
          {submitted ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-xl font-light uppercase tracking-widest">
                Thank you.
              </p>
              <p className="mt-4 text-brand-500">
                Your Massage Send To WhatsApp We Are Reply As Well As Soon. ✅
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <fieldset className="space-y-4">
                <legend className="text-sm uppercase tracking-widest text-brand-700">
                  Get in touch
                </legend>

                <input
                  type="text"
                  name="name"
                  onChange={handleChange}
                  placeholder="Full Name"
                  required
                  className="w-full border-b border-brand-300 bg-transparent py-2 text-base placeholder:text-brand-400 focus:border-brand-900 focus:outline-none"
                />

                <input
                  type="email"
                  name="email"
                  onChange={handleChange}
                  placeholder="Email"
                  required
                  className="w-full border-b border-brand-300 bg-transparent py-2 text-base placeholder:text-brand-400 focus:border-brand-900 focus:outline-none"
                />

                <textarea
                  name="message"
                  onChange={handleChange}
                  rows={4}
                  placeholder="Your message"
                  required
                  className="w-full border-b border-brand-300 bg-transparent py-2 text-base placeholder:text-brand-400 focus:border-brand-900 focus:outline-none"
                />
              </fieldset>

              <Button type="submit" variant="primary" className="w-full">
                Send Message
              </Button>
            </form>
          )}
        </AnimatedSection>

        {/* CONTACT DETAILS */}
        <AnimatedSection className="flex flex-col justify-center space-y-8 text-brand-700">
          <div>
            <h3 className="text-sm uppercase tracking-widest">Customer Care</h3>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <Mail size={18} className="text-brand-500" />
                <span className="text-base">fahanwear.support@gmail.com</span>
              </div>

              <div className="flex items-center gap-4">
                <Phone size={18} className="text-brand-500" />
                <span className="text-base">(+91) 8171423264</span>
              </div>

              <div className="flex items-start gap-4">
                <MapPin size={18} className="mt-0.5 text-brand-500" />
                <span className="text-base leading-relaxed">
                  247 Netaji Subhash Marg, west of Red Fort, New Delhi, Delhi, 110006, India
                </span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-widest mb-3">Follow</h3>

            <div className="flex gap-5 text-brand-500">
              <a href="https://instagram.com/yourusername" target="_blank">
                <FaInstagram className="hover:text-brand-900 cursor-pointer" />
              </a>

              <a href="https://facebook.com/yourusername" target="_blank">
                <FaFacebook className="hover:text-brand-900 cursor-pointer" />
              </a>

              <a href="https://snapchat.com/add/yourusername" target="_blank">
                <FaSnapchat className="hover:text-brand-900 cursor-pointer" />
              </a>

              {/* <a href="https://youtube.com/@yourchannel" target="_blank">
                <FaYoutube className="hover:text-brand-900 cursor-pointer" />
              </a> */}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}