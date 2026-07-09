import { FiMenu, FiLogOut, FiUser, FiChevronDown } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar';
import Dropdown, { DropdownItem, DropdownDivider } from '../common/Dropdown';
import NotificationsDropdown from './NotificationsDropdown';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_LABELS } from '../../utils/constants';

const Topbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-topbar items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6">
      <button type="button" onClick={onOpenMobileMenu} className="text-ink-variant transition hover:text-ink lg:hidden" aria-label="Open menu">
        <FiMenu className="h-6 w-6" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationsDropdown />

        <Dropdown
          align="right"
          trigger={
            <button type="button" className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-slate-100">
              <Avatar name={user?.name} size="sm" />
              <span className="hidden text-left sm:block">
                <span className="block text-sm font-semibold leading-tight text-ink">{user?.name}</span>
                <span className="block text-xs leading-tight text-ink-muted">{ROLE_LABELS[user?.role]}</span>
              </span>
              <FiChevronDown className="hidden h-4 w-4 text-ink-muted sm:block" />
            </button>
          }
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon={<FiUser className="h-4 w-4" />}
                onClick={() => {
                  close();
                  navigate(`/${user?.role}/profile`);
                }}
              >
                My Profile
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<FiLogOut className="h-4 w-4" />}
                danger
                onClick={() => {
                  close();
                  handleLogout();
                }}
              >
                Log out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
};

export default Topbar;
