import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiUsers } from 'react-icons/fi';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Checkbox from '../../components/common/Checkbox';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { emailRule, passwordRule } from '../../utils/validators';
import { ROLES, ROLE_LABELS, ROLE_HOME_ROUTES } from '../../utils/constants';

const ROLE_OPTIONS = [
  { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
  { value: ROLES.STAFF, label: ROLE_LABELS[ROLES.STAFF] },
  { value: ROLES.DRIVER, label: ROLE_LABELS[ROLES.DRIVER] },
  { value: ROLES.CUSTOMER, label: ROLE_LABELS[ROLES.CUSTOMER] },
];

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { email: '', password: '', role: '', remember: true } });

  const onSubmit = async ({ email, password, role }) => {
    try {
      const user = await login({ email, password, role });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirectTo = location.state?.from?.pathname || ROLE_HOME_ROUTES[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to sign in. Please try again.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
        <p className="mt-2 text-sm text-ink-muted">Sign in to access your BTMS dashboard.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leftIcon={<FiMail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email', emailRule)}
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

        <Select
          label="Role"
          placeholder="Select your role"
          options={ROLE_OPTIONS}
          error={errors.role?.message}
          {...register('role', { required: 'Please select your role' })}
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" {...register('remember')} />
          <Link to="/register" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            Need an account?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting} leftIcon={<FiLogIn className="h-4 w-4" />}>
          Sign in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-muted">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-primary-600 hover:text-primary-700">
          Create one
        </Link>
      </p>
    </motion.div>
  );
};

export default Login;
