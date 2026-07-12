import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiSave, FiLock, FiMail, FiPhone, FiBriefcase, FiCalendar } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import Badge from '../../components/common/Badge';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { updateProfile } from '../../services/userService';
import { changePassword } from '../../services/authService';
import { emailRule, phoneRule, passwordRule } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';
import { ROLE_LABELS, DEPARTMENTS } from '../../utils/constants';

const ProfileForm = ({ user, onSaved }) => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: user.name, email: user.email, phone: user.phone ?? '', department: user.department ?? '' },
  });

  useEffect(() => {
    reset({ name: user.name, email: user.email, phone: user.phone ?? '', department: user.department ?? '' });
  }, [user, reset]);

  const onSubmit = async (values) => {
    try {
      const updated = await updateProfile(values);
      onSaved(updated);
      toast.success('Profile updated successfully.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update profile.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Full Name" error={errors.name?.message} {...register('name', { required: 'Name is required.' })} />
        <Input label="Email Address" type="email" error={errors.email?.message} {...register('email', emailRule)} />
        <Input label="Phone Number" error={errors.phone?.message} {...register('phone', phoneRule)} />
        <Select label="Department" placeholder="Select department..." options={DEPARTMENTS} {...register('department')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const PasswordForm = ({ userId }) => {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } });

  const onSubmit = async (values) => {
    try {
      await changePassword(values);
      toast.success('Password changed successfully.');
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to change password.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Current Password"
          type="password"
          containerClassName="sm:col-span-2"
          error={errors.currentPassword?.message}
          {...register('currentPassword', { required: 'Current password is required.' })}
        />
        <Input
          label="New Password"
          type="password"
          error={errors.newPassword?.message}
          {...register('newPassword', passwordRule())}
        />
        <Input
          label="Confirm New Password"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your new password.',
            validate: (value) => value === getValues('newPassword') || 'Passwords do not match.',
          })}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiLock className="h-4 w-4" />} isLoading={isSubmitting}>
          Update Password
        </Button>
      </div>
    </form>
  );
};

const AdminProfile = () => {
  const { user, updateUser } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" subtitle="Manage your personal information and security settings." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center">
            <Avatar name={user.name} size="lg" />
            <h3 className="mt-4 font-display text-lg font-bold text-ink">{user.name}</h3>
            <p className="text-sm text-ink-muted">{user.email}</p>
            <Badge variant="primary" className="mt-3">{ROLE_LABELS[user.role] ?? user.role}</Badge>

            <div className="mt-6 w-full space-y-3 border-t border-slate-100 pt-4 text-left text-sm">
              <div className="flex items-center gap-2 text-ink-variant">
                <FiMail className="h-4 w-4 text-ink-muted" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-variant">
                <FiPhone className="h-4 w-4 text-ink-muted" />
                <span>{user.phone || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-variant">
                <FiBriefcase className="h-4 w-4 text-ink-muted" />
                <span>{user.department || 'Not set'}</span>
              </div>
              <div className="flex items-center gap-2 text-ink-variant">
                <FiCalendar className="h-4 w-4 text-ink-muted" />
                <span>Joined {formatDate(user.joinedDate)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Personal Information" subtitle="Update your name, contact details, and department.">
            <ProfileForm user={user} onSaved={updateUser} />
          </Card>

          <Card title="Change Password" subtitle="Use a strong password to keep your account secure.">
            <PasswordForm userId={user.id} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
