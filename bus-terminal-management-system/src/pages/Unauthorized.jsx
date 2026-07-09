import { FiLock } from 'react-icons/fi';
import Button from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { ROLE_HOME_ROUTES } from '../utils/constants';

const Unauthorized = () => {
  const { isAuthenticated, role } = useAuth();
  const homePath = isAuthenticated ? ROLE_HOME_ROUTES[role] : '/login';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50 text-danger-600">
        <FiLock className="h-8 w-8" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">403 - Access denied</h1>
        <p className="mt-2 text-sm text-ink-muted">You don&apos;t have permission to view this page with your current role.</p>
      </div>
      <Button to={homePath}>Back to {isAuthenticated ? 'dashboard' : 'login'}</Button>
    </div>
  );
};

export default Unauthorized;
