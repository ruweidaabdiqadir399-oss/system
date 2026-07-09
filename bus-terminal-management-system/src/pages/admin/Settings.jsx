import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { FiSave, FiDatabase } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Tabs from '../../components/common/Tabs';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Switch from '../../components/common/Switch';
import Button from '../../components/common/Button';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { getSettings, updateSettings } from '../../services/settingsService';
import { formatDateTime } from '../../utils/formatters';

const TABS = [
  { value: 'general', label: 'General' },
  { value: 'booking', label: 'Booking' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'payments', label: 'Payments' },
  { value: 'system', label: 'System' },
];

const TIMEZONE_OPTIONS = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'UTC'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'CAD'];

const GeneralSettingsForm = ({ data, onSaved }) => {
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings('general', values);
      toast.success('General settings updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Site Name" {...register('siteName')} />
        <Input label="Terminal Name" {...register('terminalName')} />
        <Input label="Support Email" type="email" {...register('supportEmail')} />
        <Input label="Support Phone" {...register('supportPhone')} />
        <Select label="Timezone" options={TIMEZONE_OPTIONS} {...register('timezone')} />
        <Select label="Currency" options={CURRENCY_OPTIONS} {...register('currency')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const BookingSettingsForm = ({ data, onSaved }) => {
  const toast = useToast();
  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings('booking', {
        ...values,
        advanceBookingDays: Number(values.advanceBookingDays),
        seatHoldMinutes: Number(values.seatHoldMinutes),
        cancellationWindowHours: Number(values.cancellationWindowHours),
        maxSeatsPerBooking: Number(values.maxSeatsPerBooking),
      });
      toast.success('Booking settings updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Advance Booking Window (days)"
          type="number"
          min={1}
          hint="How far ahead customers can book trips."
          {...register('advanceBookingDays')}
        />
        <Input
          label="Seat Hold Duration (minutes)"
          type="number"
          min={1}
          hint="Time a selected seat is reserved during checkout."
          {...register('seatHoldMinutes')}
        />
        <Input
          label="Cancellation Window (hours)"
          type="number"
          min={0}
          hint="Minimum notice required to cancel for a refund."
          {...register('cancellationWindowHours')}
        />
        <Input
          label="Max Seats Per Booking"
          type="number"
          min={1}
          {...register('maxSeatsPerBooking')}
        />
      </div>
      <Controller
        control={control}
        name="allowGuestBooking"
        render={({ field }) => (
          <Switch
            label="Allow Guest Booking"
            description="Let customers book trips without creating an account."
            checked={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const NOTIFICATION_FIELDS = [
  { name: 'emailBookingConfirmation', label: 'Booking Confirmation Emails', description: 'Send an email receipt when a booking is confirmed.' },
  { name: 'emailPaymentReceipt', label: 'Payment Receipt Emails', description: 'Send an email receipt after a successful payment.' },
  { name: 'smsDepartureReminder', label: 'SMS Departure Reminders', description: 'Remind passengers by SMS before departure.' },
  { name: 'driverDispatchAlerts', label: 'Driver Dispatch Alerts', description: 'Notify drivers when a new trip is assigned.' },
];

const NotificationSettingsForm = ({ data, onSaved }) => {
  const toast = useToast();
  const { handleSubmit, reset, control, formState: { isSubmitting } } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings('notifications', values);
      toast.success('Notification settings updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
        {NOTIFICATION_FIELDS.map((item) => (
          <div key={item.name} className="p-4">
            <Controller
              control={control}
              name={item.name}
              render={({ field }) => (
                <Switch label={item.label} description={item.description} checked={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const PaymentSettingsForm = ({ data, onSaved }) => {
  const toast = useToast();
  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings('payments', {
        ...values,
        taxRatePercent: Number(values.taxRatePercent),
        refundProcessingDays: Number(values.refundProcessingDays),
      });
      toast.success('Payment settings updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update settings.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
        <div className="p-4">
          <Controller
            control={control}
            name="enableCard"
            render={({ field }) => (
              <Switch label="Card Payments" description="Accept Visa, Mastercard, and other card payments." checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="p-4">
          <Controller
            control={control}
            name="enableMobileMoney"
            render={({ field }) => (
              <Switch label="Mobile Money" description="Accept mobile wallet payments." checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div className="p-4">
          <Controller
            control={control}
            name="enableCash"
            render={({ field }) => (
              <Switch label="Cash Payments" description="Allow pay-at-counter cash bookings." checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Tax Rate (%)" type="number" step="0.01" min={0} {...register('taxRatePercent')} />
        <Input label="Refund Processing (days)" type="number" min={0} {...register('refundProcessingDays')} />
      </div>
      <div className="flex justify-end">
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const SystemSettingsForm = ({ data, onSaved }) => {
  const toast = useToast();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const { handleSubmit, reset, control, formState: { isSubmitting } } = useForm({ defaultValues: data });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const onSubmit = async (values) => {
    try {
      await updateSettings('system', values);
      toast.success('System settings updated.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update settings.');
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await updateSettings('system', { lastBackup: new Date().toISOString() });
      toast.success('Backup completed successfully.');
      onSaved?.();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Backup failed.');
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="p-4 rounded-lg border border-slate-100">
        <Controller
          control={control}
          name="maintenanceMode"
          render={({ field }) => (
            <Switch
              label="Maintenance Mode"
              description="Temporarily disable new bookings for all customers."
              checked={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">App Version</p>
          <p className="mt-1 font-display text-lg font-bold text-ink">{data?.appVersion}</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Last Backup</p>
          <p className="mt-1 text-sm font-medium text-ink">{formatDateTime(data?.lastBackup)}</p>
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <Button type="button" variant="outline" leftIcon={<FiDatabase className="h-4 w-4" />} onClick={handleBackup} isLoading={isBackingUp}>
          Run Backup Now
        </Button>
        <Button type="submit" leftIcon={<FiSave className="h-4 w-4" />} isLoading={isSubmitting}>
          Save Changes
        </Button>
      </div>
    </form>
  );
};

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { data: settings, loading, refetch } = useFetch(() => getSettings(), []);

  return (
    <div>
      <PageHeader title="System Settings" subtitle="Configure global preferences for the terminal." />

      <Card noPadding>
        <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} className="px-5" />
        <div className="p-5">
          {loading ? (
            <div className="space-y-4">
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-1/2" />
            </div>
          ) : (
            <>
              {activeTab === 'general' && <GeneralSettingsForm data={settings.general} onSaved={refetch} />}
              {activeTab === 'booking' && <BookingSettingsForm data={settings.booking} onSaved={refetch} />}
              {activeTab === 'notifications' && <NotificationSettingsForm data={settings.notifications} onSaved={refetch} />}
              {activeTab === 'payments' && <PaymentSettingsForm data={settings.payments} onSaved={refetch} />}
              {activeTab === 'system' && <SystemSettingsForm data={settings.system} onSaved={refetch} />}
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;
