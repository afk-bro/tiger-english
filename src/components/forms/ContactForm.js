import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/forms/ContactForm.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema } from "@/schemas/contactSchema";
import FormInput from "@/components/ui/FormInput";
import { toast } from "sonner";
export default function ContactForm() {
    const { register, handleSubmit, reset, formState: { errors, isSubmitting }, } = useForm({
        resolver: zodResolver(contactFormSchema),
    });
    const onSubmit = async (data) => {
        try {
            // Placeholder for actual handling logic
            console.log("Contact form data submitted:", data);
            toast.success("Message sent!");
            reset();
        }
        catch {
            toast.error("Something went wrong. Please try again.");
        }
    };
    return (_jsxs("form", { onSubmit: handleSubmit(onSubmit), className: "space-y-4", children: [_jsx(FormInput, { label: "Name", id: "name", type: "text", placeholder: "Your name", ...register("name"), error: errors.name?.message }), _jsx(FormInput, { label: "Email", id: "email", type: "email", placeholder: "you@example.com", ...register("email"), error: errors.email?.message }), _jsx(FormInput, { label: "Message", id: "message", type: "textarea", placeholder: "Type your message here...", rows: 5, ...register("message"), error: errors.message?.message }), _jsx("button", { type: "submit", className: "btn btn-primary w-full disabled:opacity-60", disabled: isSubmitting, children: isSubmitting ? "Sending..." : "Send Message" })] }));
}
