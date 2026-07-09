import { useEffect, useRef, useState } from 'react';
import { FiMapPin, FiNavigation, FiClock, FiTruck, FiCheckCircle } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getBookingsByCustomer } from '../../services/bookingService';
import { getScheduleById } from '../../services/scheduleService';
import { getRouteById } from '../../services/routeService';

// ─── These constants MUST match TripSimulationMap exactly ────────────────────
const DRIVER_STEP_MS = 1800;   // TripSimulationMap: INTERVAL_MS
const STEPS_PER_SEG = 24;      // TripSimulationMap: STEPS_PER_SEGMENT

// ─── Coordinate lookup — identical to TripSimulationMap ──────────────────────
const AREA_COORDS = {
  'mogadishu': [2.0469, 45.3182],
  'hamar weyne': [2.0476, 45.3365],
  'hamar': [2.0476, 45.3365],
  'wadajir': [2.0580, 45.3130],
  'hodan': [2.0419, 45.3077],
  'yaqshid': [2.0723, 45.3305],
  'bondhere': [2.0557, 45.3314],
  'wardhigley': [2.0367, 45.3162],
  'karaan': [2.0830, 45.3182],
  'heliwa': [2.0987, 45.3332],
  'shangani': [2.0384, 45.3365],
  'shibis': [2.0517, 45.3238],
  'dharkenley': [2.0215, 45.2882],
  'huriwaa': [2.0946, 45.3057],
  'kaxda': [2.0129, 45.2642],
  'daynile': [2.0782, 45.2558],
  'bakara': [2.0476, 45.3161],
  'airport': [2.0144, 45.3047],
  'lido': [2.0665, 45.3432],
  'stadium': [2.0511, 45.3226],
  'university': [2.0584, 45.3127],
  'hospital': [2.0447, 45.3240],
  'market': [2.0476, 45.3161],
  'port': [2.0346, 45.3412],
  'afgoye': [2.1469, 45.1182],
  'km4': [2.0640, 45.3033],
  'km5': [2.0610, 45.2980],
  'km6': [2.0587, 45.2935],
  'km13': [2.0730, 45.2420],
  'medina': [2.0530, 45.3165],
  'waberi': [2.0560, 45.3250],
  'deynile': [2.0782, 45.2558],
};
const CENTER_LAT = 2.0469;
const CENTER_LNG = 45.3182;
const SPREAD = 0.09;

function nameToCoords(name) {
  const key = name.toLowerCase().trim();
  for (const [k, v] of Object.entries(AREA_COORDS)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  let h = 5381;
  for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0x7fffffff;
  return [
    CENTER_LAT + ((h & 0xff) / 255 - 0.5) * SPREAD * 2,
    CENTER_LNG + (((h >> 8) & 0xff) / 255 - 0.5) * SPREAD * 2,
  ];
}

// ─── Path builder — identical to TripSimulationMap.buildFullPath ─────────────
function buildFullPath(stopNames) {
  const pts = stopNames.map(nameToCoords);
  const path = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [la, lo] = pts[i];
    const [lb, lp] = pts[i + 1];
    for (let j = 0; j < STEPS_PER_SEG; j++) {
      const t = j / STEPS_PER_SEG;
      path.push({ lat: la + (lb - la) * t, lng: lo + (lp - lo) * t, seg: i });
    }
  }
  const last = pts[pts.length - 1];
  path.push({ lat: last[0], lng: last[1], seg: pts.length - 1 });
  return path;
}

// Calculates which step the driver simulation is at right now,
// given the trip start time and the same step interval the driver uses.
function stepFromElapsed(startMs, maxStep) {
  const elapsed = Math.max(0, Date.now() - startMs);
  return Math.min(Math.floor(elapsed / DRIVER_STEP_MS), maxStep);
}

// ─── Leaflet helpers ─────────────────────────────────────────────────────────
const MOGADISHU_CENTER = [2.0469, 45.3182];

const BUS_ICON = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;font-size:14px;">🚌</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

const CenterOnBus = ({ lat, lng }) => {
  const map = useMap();
  const prev = useRef(null);
  useEffect(() => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (prev.current !== key) { map.panTo([lat, lng], { animate: true, duration: 1 }); prev.current = key; }
  }, [lat, lng, map]);
  return null;
};

// ─── Main component ───────────────────────────────────────────────────────────
const CustomerTrackBus = () => {
  const { user } = useAuth();

  // { busPos, currentStop, nextStop, etaMinutes, progress, polyline }
  const [sim, setSim] = useState(null);
  const tickRef = useRef(null);
  const bookingPollRef = useRef(null);

  // Booking fetch — re-polled every 15 s so we detect trip completion promptly
  const { data: bookingData, loading: bookingsLoading, refetch: refetchBookings } = useFetch(
    () => getBookingsByCustomer(user.id, { pageSize: 50 }),
    [user.id]
  );

  const allBookings = bookingData?.items ?? [];
  const activeBooking =
    allBookings.find((b) => b.schedule?.status === 'On Trip') ??
    allBookings.find((b) => b.schedule?.status === 'Boarding') ??
    allBookings.find((b) => b.schedule?.status === 'Completed');
  const scheduleStatus = activeBooking?.schedule?.status ?? null;

  // Re-poll bookings every 15 s to catch completion
  useEffect(() => {
    clearInterval(bookingPollRef.current);
    if (!activeBooking || scheduleStatus === 'Completed') return;
    bookingPollRef.current = setInterval(refetchBookings, 15000);
    return () => clearInterval(bookingPollRef.current);
  }, [activeBooking, scheduleStatus, refetchBookings]);

  // ── Simulation effect ───────────────────────────────────────────────────────
  // Mirrors TripSimulationMap's logic driven by elapsed time from actualStartTime.
  // This ensures the customer sees the SAME position as the driver at all times,
  // using the same path, same interval, same step count — no separate engine.
  useEffect(() => {
    clearInterval(tickRef.current);
    setSim(null);

    if (!activeBooking?.scheduleId) return;
    if (scheduleStatus !== 'On Trip' && scheduleStatus !== 'Completed') return;

    let cancelled = false;

    const init = async () => {
      // 1 ─ Get schedule → actualStartTime (when the driver started)
      let schedule;
      try {
        schedule = await getScheduleById(activeBooking.scheduleId);
        if (cancelled) return;
      } catch { return; }

      // 2 ─ Get full route → intermediate stops for polyline + stop labels
      let routeStops = [];
      if (activeBooking.route?.id) {
        try {
          const r = await getRouteById(activeBooking.route.id);
          if (!cancelled) routeStops = r?.stops ?? [];
        } catch {}
      }
      if (cancelled) return;

      const origin = activeBooking.route?.origin ?? 'Origin';
      const destination = activeBooking.route?.destination ?? 'Destination';
      const stopNames = [origin, ...routeStops, destination].filter(Boolean);
      const path = buildFullPath(stopNames);
      const maxStep = path.length - 1;
      const durationMin = activeBooking.route?.durationMinutes ?? 60;
      const polyline = path.map((p) => [p.lat, p.lng]);

      // The trip start time the driver simulation also uses
      const startMs = schedule.actualStartTime
        ? new Date(schedule.actualStartTime).getTime()
        : Date.now();

      const compute = () => {
        const step = stepFromElapsed(startMs, maxStep);
        const pt = path[step];
        const seg = pt.seg ?? 0;
        const curStop = stopNames[Math.min(seg, stopNames.length - 1)] ?? origin;
        const nxtStop = stopNames[Math.min(seg + 1, stopNames.length - 1)] ?? destination;
        const progress = Math.round((step / maxStep) * 100);
        const etaMinutes = Math.max(0, Math.round(((maxStep - step) / maxStep) * durationMin));
        return {
          busPos: [pt.lat, pt.lng],
          currentStop: curStop,
          nextStop: nxtStop !== curStop ? nxtStop : '',
          etaMinutes,
          progress,
          polyline,
          done: step >= maxStep,
        };
      };

      // 3 ─ Set initial state immediately (no blank period)
      if (!cancelled) setSim(compute());

      // 4 ─ Tick every DRIVER_STEP_MS while On Trip
      if (scheduleStatus === 'On Trip') {
        tickRef.current = setInterval(() => {
          if (cancelled) return;
          const next = compute();
          setSim(next);
          if (next.done) clearInterval(tickRef.current);
        }, DRIVER_STEP_MS);
      }
    };

    init();

    return () => {
      cancelled = true;
      clearInterval(tickRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking?.scheduleId, scheduleStatus]);

  // ── Derived display ───────────────────────────────────────────────────────
  const busPos = sim?.busPos ?? null;
  const showMap = scheduleStatus === 'On Trip' || scheduleStatus === 'Completed';
  const showInfo = showMap && sim != null;
  const progress = scheduleStatus === 'Completed' ? 100 : (sim?.progress ?? 0);
  const etaDisplay = scheduleStatus === 'Completed' ? 'Arrived' : (sim?.etaMinutes != null ? `${sim.etaMinutes} min` : '—');

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader title="Track My Bus" subtitle="Real-time location updates for your active trips." />

      {bookingsLoading ? (
        <Card><div className="skeleton h-48 w-full" /></Card>
      ) : !activeBooking ? (
        <Card>
          <EmptyState
            icon={FiTruck}
            title="No active trips to track"
            description="No active trip is currently in progress."
          />
        </Card>
      ) : (
        <Card
          title={activeBooking.route?.name ?? 'Your Trip'}
          subtitle={`${activeBooking.route?.origin ?? ''} → ${activeBooking.route?.destination ?? ''}`}
        >
          <div className="space-y-5">

            {/* Status badge */}
            <div className="flex items-center">
              <Badge status={scheduleStatus} />
            </div>

            {/* Boarding notice */}
            {scheduleStatus === 'Boarding' && (
              <p className="rounded-lg bg-info-50 px-4 py-3 text-sm text-ink-variant">
                Your bus is boarding. Live tracking will begin once the trip starts.
              </p>
            )}

            {/* On Trip — waiting for schedule data */}
            {scheduleStatus === 'On Trip' && !sim && (
              <p className="rounded-lg bg-info-50 px-4 py-3 text-sm text-ink-variant">
                Connecting to live tracking&hellip;
              </p>
            )}

            {/* Completion banner */}
            {scheduleStatus === 'Completed' && (
              <div className="flex items-center gap-2 rounded-lg bg-success-50 px-4 py-3 text-sm font-medium text-success-600">
                <FiCheckCircle className="h-4 w-4 flex-shrink-0" />
                Your trip has been completed. Thank you for travelling with us!
              </div>
            )}

            {/* Info tiles */}
            {showInfo && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <FiMapPin className="h-3.5 w-3.5" /> Current Location
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {sim.currentStop || '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <FiNavigation className="h-3.5 w-3.5" /> Next Stop
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold text-ink">
                    {sim.nextStop || '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-muted">
                    <FiClock className="h-3.5 w-3.5" /> ETA
                  </p>
                  <p className="mt-1 text-sm font-semibold text-ink">{etaDisplay}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Progress</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{progress}%</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Live map */}
            {showMap && (
              <div className="overflow-hidden rounded-lg" style={{ height: 340 }}>
                <MapContainer
                  center={busPos ?? MOGADISHU_CENTER}
                  zoom={13}
                  scrollWheelZoom
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {sim?.polyline?.length > 1 && (
                    <Polyline positions={sim.polyline} color="#3B82F6" weight={4} opacity={0.7} />
                  )}
                  {busPos && (
                    <Marker position={busPos} icon={BUS_ICON}>
                      <Popup>
                        <span className="font-medium">
                          {scheduleStatus === 'Completed'
                            ? `Arrived: ${activeBooking.route?.destination ?? 'Destination'}`
                            : sim?.currentStop || 'Bus location'}
                        </span>
                      </Popup>
                    </Marker>
                  )}
                  {/* Auto-pan only while moving */}
                  {busPos && scheduleStatus === 'On Trip' && (
                    <CenterOnBus lat={busPos[0]} lng={busPos[1]} />
                  )}
                </MapContainer>
              </div>
            )}

          </div>
        </Card>
      )}
    </div>
  );
};

export default CustomerTrackBus;
