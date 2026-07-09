import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCreditCard } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getScheduleById } from '../../services/scheduleService';
import { createBooking } from '../../services/bookingService';
import { createPayment } from '../../services/paymentService';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';

const PAYMENT_METHOD_OPTIONS = ['EVC Plus', 'Sahal', 'Zaad', 'eDahab', 'Bank Card'];

const CustomerCheckout = () => {
  const { scheduleId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const seatNumbers = location.state?.seatNumbers ?? [];
  const passengers = location.state?.passengers ?? [];

  const { data: schedule, loading } = useFetch(() => getScheduleById(scheduleId), [scheduleId]);

  const { register, handleSubmit } = useForm({ defaultValues: { paymentMethod: 'EVC Plus' } });

  if (!seatNumbers.length) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <Card>
          <EmptyState
            title="No seats selected"
            description="Please select your seats before checking out."
            action={<Button to={`/customer/book/${scheduleId}/seats`}>Select Seats</Button>}
          />
        </Card>
      </div>
    );
  }

  if (loading || !schedule) {
    return (
      <div>
        <PageHeader title="Checkout" />
        <Card>
          <div className="skeleton h-48 w-full" />
        </Card>
      </div>
    );
  }

  const fare = schedule.route?.fare ?? 0;
  const total = Math.round(fare * seatNumbers.length * 100) / 100;

  const onSubmit = async (values) => {
    setIsSubmitting(true);
    try {
      const booking = await createBooking({ scheduleId, customerId: user.id, seatNumbers, passengers, paymentMethod: values.paymentMethod });
      await createPayment({ bookingId: booking._id, amount: total, method: values.paymentMethod });
      toast.success('Booking confirmed! Your e-tickets are ready.');
      navigate('/customer/bookings');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to complete your booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Checkout"
        subtitle="Review your trip details and confirm payment."
        actions={
          <Button variant="outline" leftIcon={<FiArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Trip Details">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-lg font-bold text-ink">{schedule.route?.name}</p>
                <p className="text-sm text-ink-muted">{schedule.route?.origin} → {schedule.route?.destination}</p>
              </div>
              <Badge status={schedule.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">Date</p>
                <p className="mt-1 font-medium text-ink">{formatDate(schedule.date)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">Departure</p>
                <p className="mt-1 font-medium text-ink">{formatTime(schedule.departureTime)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">Gate</p>
                <p className="mt-1 font-medium text-ink">{schedule.gate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-muted">Bus</p>
                <p className="mt-1 font-medium text-ink">{schedule.bus?.busNumber ?? '-'}</p>
              </div>
            </div>
          </Card>

          <Card title="Passengers" noPadding>
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Seat</th>
                    <th>Passenger</th>
                    <th>Age</th>
                    <th>Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p) => (
                    <tr key={p.seatNumber}>
                      <td className="font-medium text-ink">{p.seatNumber}</td>
                      <td>{p.name}</td>
                      <td>{p.age}</td>
                      <td>{p.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Payment Method">
            <Select options={PAYMENT_METHOD_OPTIONS} {...register('paymentMethod')} />
          </Card>
        </div>

        <Card title="Order Summary">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Fare per seat</span>
              <span className="font-medium text-ink">{formatCurrency(fare)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Seats</span>
              <span className="font-medium text-ink">{seatNumbers.join(', ')} ({seatNumbers.length})</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display font-bold text-ink">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button
            className="mt-6 w-full justify-center"
            size="lg"
            leftIcon={<FiCreditCard className="h-4 w-4" />}
            isLoading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
          >
            Confirm & Pay
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CustomerCheckout;
