import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import Card from '../common/Card';
import { getRouteById } from '../../services/routeService';
import { updateTracking } from '../../services/trackingService';

// Approximate coordinates for Mogadishu districts and landmarks
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
  // Deterministic hash for unknown names — stays within Mogadishu bounding box
  let h = 5381;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) + h + name.charCodeAt(i)) & 0x7fffffff;
  }
  const lat = CENTER_LAT + ((h & 0xff) / 255 - 0.5) * SPREAD * 2;
  const lng = CENTER_LNG + (((h >> 8) & 0xff) / 255 - 0.5) * SPREAD * 2;
  return [lat, lng];
}

const STEPS_PER_SEGMENT = 24;
const INTERVAL_MS = 1800;
const BACKEND_SYNC_EVERY = 6; // sync every ~11 seconds

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function buildFullPath(stopNames) {
  const waypoints = stopNames.map(nameToCoords);
  const path = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];
    for (let j = 0; j < STEPS_PER_SEGMENT; j++) {
      const t = j / STEPS_PER_SEGMENT;
      path.push({ lat: lerp(lat1, lat2, t), lng: lerp(lng1, lng2, t), segIdx: i });
    }
  }
  const last = waypoints[waypoints.length - 1];
  path.push({ lat: last[0], lng: last[1], segIdx: waypoints.length - 1 });
  return path;
}

const BUS_ICON = L.divIcon({
  className: '',
  html: '<div style="width:30px;height:30px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;font-size:14px;">🚌</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -18],
});

const FitRoute = ({ coords }) => {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!fitted.current && coords.length > 1) {
      map.fitBounds(coords, { padding: [32, 32], maxZoom: 14 });
      fitted.current = true;
    }
  }, [coords, map]);
  return null;
};

const TripSimulationMap = ({ trip, busId }) => {
  const [path, setPath] = useState([]);
  const [stopNames, setStopNames] = useState([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [ready, setReady] = useState(false);

  const pathRef = useRef([]);
  const stopNamesRef = useRef([]);
  const stepIdxRef = useRef(0);
  const intervalRef = useRef(null);
  const syncCountRef = useRef(0);

  // Build the simulation path from route data
  useEffect(() => {
    let cancelled = false;
    const fallbackNames = [
      trip.route?.origin ?? 'Origin',
      trip.route?.destination ?? 'Destination',
    ];

    const init = (names) => {
      if (cancelled) return;
      const built = buildFullPath(names.filter(Boolean));
      pathRef.current = built;
      stopNamesRef.current = names;
      stepIdxRef.current = 0;
      setPath(built);
      setStopNames(names);
      setStepIdx(0);
      setReady(true);
    };

    if (trip.routeId) {
      getRouteById(trip.routeId)
        .then((route) => {
          const names = [route.origin, ...(route.stops ?? []), route.destination].filter(Boolean);
          init(names.length >= 2 ? names : fallbackNames);
        })
        .catch(() => init(fallbackNames));
    } else {
      init(fallbackNames);
    }

    return () => { cancelled = true; };
  }, [trip.routeId, trip.route?.origin, trip.route?.destination]);

  // Run the simulation interval — only when trip is On Trip
  useEffect(() => {
    if (!ready || trip.status !== 'On Trip') return;

    syncCountRef.current = 0;
    stepIdxRef.current = 0;
    setStepIdx(0);

    intervalRef.current = setInterval(() => {
      const currentPath = pathRef.current;
      const maxStep = currentPath.length - 1;
      if (maxStep <= 0) return;

      stepIdxRef.current = Math.min(stepIdxRef.current + 1, maxStep);
      const idx = stepIdxRef.current;
      setStepIdx(idx);

      syncCountRef.current += 1;
      const shouldSync = syncCountRef.current % BACKEND_SYNC_EVERY === 0 || idx === maxStep;

      if (shouldSync && busId) {
        const step = currentPath[idx];
        const names = stopNamesRef.current;
        const seg = step.segIdx ?? 0;
        const curStop = names[Math.min(seg, names.length - 1)] ?? '';
        const nxtStop = names[Math.min(seg + 1, names.length - 1)] ?? '';
        const durationMin = trip.route?.durationMinutes ?? 60;
        const etaMinutes = Math.max(0, Math.round(((maxStep - idx) / maxStep) * durationMin));

        updateTracking(busId, {
          position: { lat: step.lat, lng: step.lng },
          currentLocation: curStop,
          nextStop: nxtStop !== curStop ? nxtStop : '',
          etaMinutes,
          status: 'On Time',
          speedKmh: Math.round(28 + Math.random() * 34),
          lastUpdated: new Date(),
        }).catch(() => {});
      }

      if (idx >= maxStep) {
        clearInterval(intervalRef.current);
      }
    }, INTERVAL_MS);

    return () => {
      clearInterval(intervalRef.current);
      // Save final simulated position when component unmounts or trip completes
      const currentPath = pathRef.current;
      const names = stopNamesRef.current;
      const idx = stepIdxRef.current;
      if (busId && currentPath.length > 0) {
        const step = currentPath[Math.min(idx, currentPath.length - 1)];
        const seg = step.segIdx ?? 0;
        updateTracking(busId, {
          position: { lat: step.lat, lng: step.lng },
          currentLocation: names[Math.min(seg, names.length - 1)] ?? '',
          status: 'Offline',
          etaMinutes: 0,
          speedKmh: 0,
          lastUpdated: new Date(),
        }).catch(() => {});
      }
    };
  }, [ready, trip.status, busId, trip.route?.durationMinutes]);

  if (!ready || path.length < 2) return null;

  const maxStep = path.length - 1;
  const step = path[stepIdx] ?? path[0];
  const progress = maxStep > 0 ? Math.round((stepIdx / maxStep) * 100) : 100;
  const durationMin = trip.route?.durationMinutes ?? 60;
  const etaMinutes = Math.max(0, Math.round(((maxStep - stepIdx) / maxStep) * durationMin));
  const seg = step.segIdx ?? 0;
  const currentStop = stopNames[Math.min(seg, stopNames.length - 1)] ?? '';
  const nextStop = stopNames[Math.min(seg + 1, stopNames.length - 1)] ?? '';
  const polylineCoords = path.map((p) => [p.lat, p.lng]);
  const markerPos = [step.lat, step.lng];

  return (
    <Card title="Live Tracking Simulation" subtitle="Simulated route progress — updates every 2 seconds" className="mt-6">
      <div className="overflow-hidden rounded-lg" style={{ height: 340 }}>
        <MapContainer
          center={markerPos}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitRoute coords={polylineCoords} />
          <Polyline positions={polylineCoords} color="#3B82F6" weight={4} opacity={0.75} />
          <Marker position={markerPos} icon={BUS_ICON}>
            <Popup>
              <span className="font-medium">{currentStop || 'Bus location'}</span>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Current Stop</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">{currentStop || '—'}</p>
        </div>
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Next Stop</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink">
            {nextStop && nextStop !== currentStop ? nextStop : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Progress</p>
          <p className="mt-1 text-sm font-semibold text-ink">{progress}%</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <div className="rounded-lg border border-slate-100 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">ETA</p>
          <p className="mt-1 text-sm font-semibold text-ink">{etaMinutes} min</p>
        </div>
      </div>
    </Card>
  );
};

export default TripSimulationMap;
