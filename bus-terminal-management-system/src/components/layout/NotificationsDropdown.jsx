import { useEffect, useState } from 'react';
import { FiBell, FiCheckCircle, FiAlertTriangle, FiXCircle, FiInfo } from 'react-icons/fi';
import Dropdown from '../common/Dropdown';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import { timeAgo } from '../../utils/formatters';

const TYPE_STYLES = {
  success: { icon: FiCheckCircle, className: 'text-success-600 bg-success-50' },
  warning: { icon: FiAlertTriangle, className: 'text-warning-600 bg-warning-50' },
  error: { icon: FiXCircle, className: 'text-danger-600 bg-danger-50' },
  info: { icon: FiInfo, className: 'text-info-600 bg-info-50' },
};

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { items, unreadCount: count } = await getNotifications({ pageSize: 20 });
      setNotifications(items);
      setUnreadCount(count);
    } catch {
      // Silently fail — notifications are non-critical
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    await markAllAsRead();
    load();
  };

  const handleItemClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification._id ?? notification.id);
      load();
    }
  };

  return (
    <Dropdown
      align="right"
      menuClassName="w-80 sm:w-96"
      trigger={
        <button type="button" className="relative rounded-full p-2 text-ink-variant transition hover:bg-slate-100 hover:text-ink" aria-label="Notifications">
          <FiBell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger-500 ring-2 ring-white" />
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
        <p className="text-sm font-semibold text-ink">Notifications</p>
        {unreadCount > 0 && (
          <button type="button" onClick={handleMarkAllRead} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState title="No notifications" description="You're all caught up." className="py-8" />
        ) : (
          notifications.map((notification) => {
            const { icon: Icon, className } = TYPE_STYLES[notification.type] ?? TYPE_STYLES.info;
            const notifId = notification._id ?? notification.id;
            return (
              <button
                key={notifId}
                type="button"
                onClick={() => handleItemClick(notification)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  notification.read ? '' : 'bg-primary-50/50'
                }`}
              >
                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${className}`}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 overflow-hidden">
                  <span className="block text-sm font-semibold text-ink">{notification.title}</span>
                  <span className="line-clamp-2 block text-xs text-ink-muted">{notification.message}</span>
                  <span className="mt-1 block text-xs text-ink-muted">{timeAgo(notification.timestamp ?? notification.createdAt)}</span>
                </span>
                {!notification.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />}
              </button>
            );
          })
        )}
      </div>
    </Dropdown>
  );
};

export default NotificationsDropdown;
