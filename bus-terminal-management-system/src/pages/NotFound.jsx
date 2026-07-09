import { FiAlertCircle } from 'react-icons/fi';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../utils/constants';

const NotFound = () => {
  const { isAuthenticated, role } = useAuth();
  const homePath = isAuthenticated ? ROLE_HOME_ROUTES[role] : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <FiAlertCircle className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">404 - Page not found</h1>
        <p className="mt-2 text-sm text-ink-muted">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      </div>
      <Button to={homePath}>Back to {isAuthenticated ? 'dashboard' : 'login'}</Button>
    </div>
  );
};

export default NotFound;
