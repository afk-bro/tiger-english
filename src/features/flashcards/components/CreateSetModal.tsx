import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or fewer'),
  description: z.string().max(300, 'Description must be 300 characters or fewer').optional(),
});

type FormData = z.infer<typeof schema>;

interface CreateSetModalProps {
  onClose: () => void;
  onSubmit: (title: string, description: string | null) => Promise<void>;
}

export function CreateSetModal({ onClose, onSubmit }: CreateSetModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const submit = async (data: FormData) => {
    try {
      await onSubmit(data.title, data.description ?? null);
      onClose();
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Failed to create set',
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Create flashcard set
        </h2>

        <form onSubmit={handleSubmit(submit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              {...register('title')}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100"
              placeholder="e.g. Business English"
            />
            {errors.title && (
              <p className="text-xs text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 dark:bg-gray-700 dark:text-gray-100 resize-none"
              placeholder="Optional description"
            />
            {errors.description && (
              <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
            )}
          </div>

          {errors.root && (
            <p className="text-xs text-red-600">{errors.root.message}</p>
          )}

          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create set'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
