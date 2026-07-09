import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useToast } from '../../hooks/useToast';
import { getScheduleById } from '../../services/scheduleService';
import { getSeatMap } from '../../services/bookingService';
import { formatCurrency, formatDate, formatTime, formatDuration } from '../../utils/formatters';

const MAX_SEATS = 6;
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const CustomerSeatSelection = () => {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const { data: schedule, loading: scheduleLoading, error: scheduleError } = useFetch(
    () => getScheduleById(scheduleId),
    [scheduleId]
  );
  const { data: seatMap, loading: seatMapLoading, error: seatMapError } = useFetch(
    () => getSeatMap(scheduleId),
    [scheduleId]
  );

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengers, setPassengers] = useState([]);

  useEffect(() => {
    setPassengers((prev) =>
      selectedSeats.map(
        (seat) => prev.find((p) => p.seatNumber === seat) ?? { seatNumber: seat, name: '', age: '', gender: 'Male' }
      )
    );
  }, [selectedSeats]);

  const toggleSeat = (seat) => {
    if (seatMap?.bookedSeats?.includes(seat)) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seat)) return prev.filter((s) => s !== seat);
      if (prev.length >= MAX_SEATS) {
        toast.warning(`You can select up to ${MAX_SEATS} seats per booking.`);
        return prev;
      }
      return [...prev, seat];
    });
  };

  const updatePassenger = (seat, field, value) => {
    setPassengers((prev) => prev.map((p) => (p.seatNumber === seat ? { ...p, [field]: value } : p)));
  };

  const handleContinue = () => {
    if (!selectedSeats.length) {
      toast.error('Please select at least one seat to continue.');
      return;
    }
    if (passengers.some((p) => !p.name.trim() || !p.age)) {
      toast.error('Please enter a name and age for every passenger.');
      return;
    }
    navigate(`/customer/book/${scheduleId}/checkout`, {
      state: { seatNumbers: selectedSeats, passengers: passengers.map((p) => ({ ...p, age: Number(p.age) })) },
    });
  };

  if (scheduleError || seatMapError) {
    return (
      <div>
        <PageHeader
          title="Select Seats"
          actions={
            <Button variant="outline" to="/customer/search" leftIcon={<FiArrowLeft className="h-4 w-4" />}>
              Back to Search
            </Button>
          }
        />
        <Card>
          <ErrorState title="Unable to load this trip" message={scheduleError || seatMapError} />
        </Card>
      </div>
    );
  }

  if (scheduleLoading || seatMapLoading || !schedule || !seatMap) {
    return (
      <div>
        <PageHeader title="Select Seats" />
        <Card>
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-64 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  const total = seatMap.fare * selectedSeats.length;

  return (
    <div>
      <PageHeader
        title="Select Your Seats"
        subtitle={`${schedule.route?.name} · ${schedule.route?.origin} → ${schedule.route?.destination}`}
        actions={
          <Button variant="outline" leftIcon={<FiArrowLeft className="h-4 w-4" />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Seat Map" subtitle={`${seatMap.availableSeats} of ${seatMap.totalSeats} seats available`} className="lg:col-span-2">
          <div className="mb-6 flex items-center justify-center gap-6 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded border border-slate-200 bg-white" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded border border-primary-600 bg-primary-600" /> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-4 w-4 rounded border border-slate-200 bg-slate-100" /> Booked
            </span>
          </div>

          <div className="mx-auto flex max-w-xs flex-col items-center gap-2 sm:max-w-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Front of Bus</p>
            {seatMap.layout.map((row, rowIdx) => (
              <div key={rowIdx} className="flex items-center gap-2">
                {row.map((seat, colIdx) => {
                  const isBooked = seatMap.bookedSeats.includes(seat);
                  const isSelected = selectedSeats.includes(seat);
                  return (
                    <button
                      key={seat}
                      type="button"
                      disabled={isBooked}
                      onClick={() => toggleSeat(seat)}
                      className={`flex h-10 w-10 items-center justify-center rounded-md border text-xs font-semibold transition ${
                        colIdx === 2 ? 'ml-6' : ''
                      } ${
                        isBooked
                          ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                          : isSelected
                            ? 'border-primary-600 bg-primary-600 text-white'
                            : 'border-slate-200 bg-white text-ink-variant hover:border-primary-400 hover:text-primary-600'
                      }`}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>

        <Card title="Trip Summary">
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Date</span>
              <span className="font-medium text-ink">{formatDate(schedule.date)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Departure</span>
              <span className="font-medium text-ink">{formatTime(schedule.departureTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Arrival</span>
              <span className="font-medium text-ink">{formatTime(schedule.arrivalTime)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Duration</span>
              <span className="font-medium text-ink">{formatDuration(schedule.route?.durationMinutes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Gate</span>
              <span className="font-medium text-ink">{schedule.gate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Bus</span>
              <span className="font-medium text-ink">{schedule.bus?.busNumber ?? '-'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-ink-muted">Fare per seat</span>
              <span className="font-medium text-ink">{formatCurrency(seatMap.fare)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-muted">Selected Seats</span>
              <span className="font-medium text-ink">{selectedSeats.length ? selectedSeats.join(', ') : '-'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-base">
              <span className="font-semibold text-ink">Total</span>
              <span className="font-display font-bold text-ink">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Passenger Details" subtitle="Enter details for each selected passenger" className="mt-6">
        {selectedSeats.length === 0 ? (
          <EmptyState title="No seats selected" description="Select one or more seats on the map to enter passenger details." />
        ) : (
          <div className="space-y-4">
            {passengers.map((passenger) => (
              <div key={passenger.seatNumber} className="grid grid-cols-1 gap-4 rounded-lg border border-slate-100 p-4 sm:grid-cols-4 sm:items-end">
                <div className="flex items-center text-sm font-semibold text-ink sm:pb-2.5">Seat {passenger.seatNumber}</div>
                <Input
                  label="Full Name"
                  value={passenger.name}
                  onChange={(e) => updatePassenger(passenger.seatNumber, 'name', e.target.value)}
                  containerClassName="sm:col-span-1"
                />
                <Input
                  label="Age"
                  type="number"
                  min={0}
                  value={passenger.age}
                  onChange={(e) => updatePassenger(passenger.seatNumber, 'age', e.target.value)}
                  containerClassName="sm:col-span-1"
                />
                <Select
                  label="Gender"
                  options={GENDER_OPTIONS}
                  value={passenger.gender}
                  onChange={(e) => updatePassenger(passenger.seatNumber, 'gender', e.target.value)}
                  containerClassName="sm:col-span-1"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 flex justify-end">
        <Button size="lg" rightIcon={<FiArrowRight className="h-4 w-4" />} onClick={handleContinue}>
          Continue to Checkout
        </Button>
      </div>
    </div>
  );
};

export default CustomerSeatSelection;
