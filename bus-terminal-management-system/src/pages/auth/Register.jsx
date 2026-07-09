import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiUserPlus } from 'react-icons/fi';
import Input from '../../components/common/Input';
import Checkbox from '../../components/common/Checkbox';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { emailRule, passwordRule, confirmPasswordRule, phoneRule, minLengthRule } from '../../utils/validators';
import { ROLE_HOME_ROUTES } from '../../utils/constants';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerAccount } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', email: '', phone: '', password: '', confirmPassword: '', terms: false },
  });

  const onSubmit = async ({ name, email, phone, password }) => {
    try {
      const user = await registerAccount({ name, email, phone, password });
      toast.success(`Welcome to BTMS, ${user.name.split(' ')[0]}!`);
      navigate(ROLE_HOME_ROUTES[user.role] || '/', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to create your account. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink-muted">Book trips, manage tickets, and track buses in real time.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Doe"
          leftIcon={<FiUser className="h-4 w-4" />}
          error={errors.name?.message}
          {...register('name', minLengthRule('Full name', 2))}
        />

        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<FiMail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email', emailRule)}
        />

        <Input
          label="Phone number"
          type="tel"
          placeholder="+252 61 234 5678"
          leftIcon={<FiPhone className="h-4 w-4" />}
          error={errors.phone?.message}
          {...register('phone', phoneRule)}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<FiLock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-ink-muted transition hover:text-ink"
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password', passwordRule())}
        />

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="••••••••"
          leftIcon={<FiLock className="h-4 w-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', confirmPasswordRule(getValues))}
        />

        <Checkbox
          label="I agree to the Terms of Service and Privacy Policy"
          error={errors.terms?.message}
          {...register('terms', { required: 'You must accept the terms to continue.' })}
        />

        <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<FiUserPlus className="h-4 w-4" />}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
};

export default Register;
