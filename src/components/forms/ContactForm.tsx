// src/components/forms/ContactForm.tsx
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, ContactFormData } from "@/schemas/contactSchema";
import FormInput from "@/components/ui/FormInput";
import { toast } from "sonner";

export default function ContactForm() {
  const { t } = useTranslation();
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
      toast.success(t('contact.form.success'));
      reset();
    } catch {
      toast.error(t('contact.form.error'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormInput
        label={t('contact.form.name_label')}
        id="name"
        type="text"
        placeholder={t('contact.form.name_placeholder')}
        {...register("name")}
        error={errors.name?.message}
      />
      <FormInput
        label={t('contact.form.email_label')}
        id="email"
        type="email"
        placeholder={t('contact.form.email_placeholder')}
        {...register("email")}
        error={errors.email?.message}
      />
      <FormInput
        label={t('contact.form.message_label')}
        id="message"
        type="textarea"
        placeholder={t('contact.form.message_placeholder')}
        rows={5}
        {...register("message")}
        error={errors.message?.message}
      />
      <button
        type="submit"
        className="btn btn-primary w-full disabled:opacity-60"
        disabled={isSubmitting}
      >
        {isSubmitting ? t('contact.form.sending') : t('contact.form.submit')}
      </button>
    </form>
  );
}
