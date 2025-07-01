// src/components/forms/ContactForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, ContactFormData } from "@/schemas/contactSchema";
import FormInput from "@/components/ui/FormInput";
import { toast } from "sonner";

export default function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Placeholder for actual handling logic
      console.log("Contact form data submitted:", data);
      toast.success("Message sent!");
      reset();
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        label="Name"
        id="name"
        type="text"
        placeholder="Your name"
        {...register("name")}
        error={errors.name?.message}
      />
      <FormInput
        label="Email"
        id="email"
        type="email"
        placeholder="you@example.com"
        {...register("email")}
        error={errors.email?.message}
      />
      <FormInput
        label="Message"
        id="message"
        type="textarea"
        placeholder="Type your message here..."
        rows={5}
        {...register("message")}
        error={errors.message?.message}
      />
      <button
        type="submit"
        className="btn btn-primary w-full disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
