import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { childApi } from '../../services/api/childApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const childSchema = z.object({
  name: z.string().min(2, 'Child name must be at least 2 characters'),
  dob: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date of birth required' }),
  gender: z.enum(['Male', 'Female', 'Other']),
  school: z.string().optional(),
  grade: z.string().optional(),
  parentNotes: z.string().optional()
});

type ChildFormData = z.infer<typeof childSchema>;

export interface AddChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddChildModal: React.FC<AddChildModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChildFormData>({
    resolver: zodResolver(childSchema),
    defaultValues: {
      gender: 'Male',
      dob: '2020-01-01'
    }
  });

  const onSubmit = async (data: ChildFormData) => {
    if (!user) return;
    try {
      const birthYear = new Date(data.dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const calculatedAge = Math.max(1, currentYear - birthYear);

      await childApi.addChild({
        name: data.name,
        dob: data.dob,
        age: calculatedAge,
        gender: data.gender,
        school: data.school,
        grade: data.grade,
        parentNotes: data.parentNotes
      });

      showToast(`Child record created for ${data.name}!`, 'success');
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      showToast(err?.message || 'Failed to add child profile', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="+ Add Child Profile" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Child Full Name"
          placeholder="e.g. Aarav Sharma"
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Date of Birth
            </label>
            <input
              type="date"
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              {...register('dob')}
            />
            {errors.dob && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.dob.message}</p>}
          </div>

          <Select
            label="Gender"
            options={[
              { label: 'Male', value: 'Male' },
              { label: 'Female', value: 'Female' },
              { label: 'Other', value: 'Other' }
            ]}
            error={errors.gender?.message}
            {...register('gender')}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="School Name (Optional)" placeholder="e.g. St. Xavier Academy" {...register('school')} />
          <Input label="Class / Grade (Optional)" placeholder="e.g. Kindergarten" {...register('grade')} />
        </div>

        <Textarea
          label="Parent Observations / Special Notes"
          placeholder="Describe any sensory preferences, favorite activities, speech patterns, or routine behaviors..."
          rows={3}
          {...register('parentNotes')}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Save Child Profile
          </Button>
        </div>
      </form>
    </Modal>
  );
};
