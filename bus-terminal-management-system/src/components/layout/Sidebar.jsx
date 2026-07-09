import { NavLink } from 'react-router-dom';
import { FiX, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { NAV_CONFIG } from '../../config/navigation';
import { APP_NAME, ROLE_LABELS } from '../../utils/constants';

const Sidebar = ({ role, collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) => {
  const navItems = NAV_CONFIG[role] ?? [];

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-sidebar transition-all duration-200
          ${collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="flex h-topbar items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img src="/bus-icon.svg" alt={APP_NAME} className="h-9 w-9 flex-shrink-0" />
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="truncate font-display text-base font-bold text-white">{APP_NAME}</p>
                <p className="truncate text-xs text-primary-300">{ROLE_LABELS[role]}</p>
              </div>
            )}
          </div>
          <button type="button" onClick={onCloseMobile} className="text-primary-200 transition hover:text-white lg:hidden" aria-label="Close menu">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) => (isActive ? 'nav-link-active' : 'nav-link')}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden items-center justify-center gap-2 border-t border-white/10 px-3 py-3 text-sm font-medium text-primary-200 transition hover:bg-sidebar-hover hover:text-white lg:flex"
        >
          {collapsed ? (
            <FiChevronsRight className="h-4 w-4" />
          ) : (
            <>
              <FiChevronsLeft className="h-4 w-4" />
              Collapse
            </>
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
