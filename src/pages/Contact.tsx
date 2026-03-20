import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useState } from "react";
import { contactFormSchema, type ContactFormData } from "@/schemas/contactSchema";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call - replace with actual backend integration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, just log the data (replace with actual submission)
      console.log("Contact form data:", data);
      
      toast.success("Message sent successfully! I'll get back to you soon.");
      reset();
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error("Contact form error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const socialLinks = [
    { name: "GitHub", icon: "🐙", href: "#", comingSoon: true },
    { name: "LinkedIn", icon: "💼", href: "#", comingSoon: true },
    { name: "Twitter", icon: "🐦", href: "#", comingSoon: true },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Form Section */}
        <section className="card card-lg">
          <header className="mb-8">
            <h1 className="text-display heading-accent mb-2">
              Get In Touch
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Have questions, feedback, or just want to say hello? I'd love to hear from you!
            </p>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <FormInput
                {...register("name")}
                name="name"
                label="Name"
                placeholder="Your full name"
                disabled={isSubmitting}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <FormInput
                {...register("email")}
                name="email"
                label="Email"
                type="email"
                placeholder="your.email@example.com"
                disabled={isSubmitting}
                icon={
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Message
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <textarea
                  {...register("message")}
                  id="message"
                  name="message"
                  rows={5}
                  placeholder="Tell me about your question, feedback, or just say hello..."
                  disabled={isSubmitting}
                  className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-500 resize-none"
                />
              </div>
              {errors.message && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.message.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-gray font-medium py-3 px-6 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </div>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>
        </section>

        {/* Contact Information Section */}
        <section className="card card-lg">
          <header className="mb-8">
            <h2 className="text-display heading-accent mb-4">
              Let's Connect
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              I'm always excited to connect with fellow language learners, educators, and developers.
            </p>
          </header>

          {/* Direct Contact */}
          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              Direct Contact
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <div className="ml-3">
                  <a
                    href="mailto:youremail@example.com"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                  >
                    youremail@example.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="mb-8">
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              Social Media
            </h3>
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <div
                  key={social.name}
                  className="relative group"
                  role="button"
                  tabIndex={0}
                  aria-label={`${social.name} profile (coming soon)`}
                >
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 opacity-60 cursor-not-allowed">
                    <span className="text-sm" role="img" aria-hidden="true">
                      {social.icon}
                    </span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      {social.name}
                    </span>
                  </div>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    Coming Soon
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
              Quick Questions?
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  What's the best way to reach you?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Email is the most reliable way to get in touch. I typically respond within 24-48 hours.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Can you help with my English learning?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Absolutely! I love helping learners. Feel free to share your questions or challenges.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Are you available for collaboration?
                </p>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  I'm always open to interesting projects and collaborations. Let's discuss your ideas!
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
