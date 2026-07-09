import { useEffect, useMemo, useState, useRef } from 'react';
import { FiTruck, FiCheckCircle, FiClock, FiWifiOff, FiArrowRight, FiUsers, FiNavigation, FiRefreshCw } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import StatCard from '../../components/common/StatCard';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { getLiveTracking, getFleetOverview, TRACKING_STATUS_FILTERS } from '../../services/trackingService';

const MOGADISHU_CENTER = [2.0469, 45.3182];

const STATUS_COLORS = {
  'On Time': '#22C55E', // Success
  Delayed: '#F59E0B', // Warning
  Offline: '#9CA3AF', // Muted
};

const createBusIcon = (status) => {
  const color = STATUS_COLORS[status] ?? '#9CA3AF';
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
};

const FitBounds = ({ buses }) => {
  const map = useMap();
  useEffect(() => {
    if (!buses.length) return;
    const coords = buses
      .filter((b) => b.position?.lat && b.position?.lng)
      .map((b) => [b.position.lat, b.position.lng]);
    if (coords.length) {
      map.fitBounds(coords, { padding: [40, 40], maxZoom: 15 });
    }
  }, [buses, map]);
  return null;
};

const FleetMap = ({ buses, selectedBusId, onSelect }) => {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
      <MapContainer
        center={MOGADISHU_CENTER}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        style={{ minHeight: '320px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds buses={buses} />
        {buses
          .filter((b) => b.position?.lat && b.position?.lng)
          .map((bus) => (
            <Marker
              key={bus.busId}
              position={[bus.position.lat, bus.position.lng]}
              icon={createBusIcon(bus.status)}
              eventHandlers={{ click: () => onSelect(bus.busId) }}
            >
              <Popup>
                <div className="min-w-[180px] text-sm">
                  <p className="font-bold">{bus.bus?.busNumber ?? bus.busId}</p>
                  <p className="text-slate-500">{bus.route?.name ?? 'No route'}</p>
                  <hr className="my-1" />
                  <p>Driver: {bus.driverName || '—'}</p>
                  <p>Speed: {bus.speedKmh} km/h</p>
                  <p>ETA: {bus.etaMinutes != null ? `${bus.etaMinutes} min` : '—'}</p>
                  <p>Location: {bus.currentLocation || '—'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-3 rounded-md bg-white/90 px-3 py-1.5 text-xs shadow-sm backdrop-blur">
        {Object.entries(STATUS_COLORS).map(([label, color]) => (
          <span key={label} className="flex items-center gap-1.5 text-ink-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

const AdminTracking = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [selectedBusId, setSelectedBusId] = useState(null);
  const intervalRef = useRef(null);

  const { data, loading, refetch } = useFetch(
    () => getLiveTracking({ search: debouncedSearch, status, page: 1, pageSize: 50 }),
    [debouncedSearch, status]
  );
  const { data: overview, refetch: refetchOverview } = useFetch(() => getFleetOverview(), []);

  const buses = useMemo(() => data?.items ?? [], [data]);

  useEffect(() => {
    if (buses.length && !buses.some((b) => b.busId === selectedBusId)) {
      setSelectedBusId(buses[0].busId);
    }
  }, [buses, selectedBusId]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refetch();
      refetchOverview();
    }, 30000);
    return () => clearInterval(intervalRef.current);
  }, [refetch, refetchOverview]);

  const selectedBus = buses.find((b) => b.busId === selectedBusId);

  const columns = [
    {
      key: 'bus',
      header: 'Bus',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.bus?.busNumber ?? row.busId}</p>
          <p className="text-xs text-ink-muted">{row.route?.code} &middot; {row.driverName}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'location',
      header: 'Location',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-ink-variant">
          <span className="max-w-[160px] truncate">{row.currentLocation}</span>
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted" />
          <span className="max-w-[140px] truncate">{row.nextStop}</span>
        </div>
      ),
    },
    { key: 'speedKmh', header: 'Speed', render: (row) => `${row.speedKmh} km/h` },
    { key: 'etaMinutes', header: 'ETA', render: (row) => (row.etaMinutes != null ? `${row.etaMinutes} min` : '-') },
    {
      key: 'fuelLevel',
      header: 'Fuel',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${row.fuelLevel < 30 ? 'bg-danger-500' : 'bg-secondary-500'}`}
              style={{ width: `${row.fuelLevel}%` }}
            />
          </div>
          <span className="text-xs text-ink-muted">{row.fuelLevel}%</span>
        </div>
      ),
    },
    { key: 'passengerCount', header: 'Passengers' },
  ];

  return (
    <div>
      <PageHeader
        title="Live Tracking"
        subtitle="Monitor your fleet's real-time location and status."
        actions={
          <button
            type="button"
            onClick={() => { refetch(); refetchOverview(); }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-slate-50 hover:text-ink"
          >
            <FiRefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiTruck} label="Tracked Buses" value={overview?.total ?? '...'} color="primary" />
        <StatCard icon={FiCheckCircle} label="On Time" value={overview?.byStatus?.['On Time'] ?? 0} color="success" />
        <StatCard icon={FiClock} label="Delayed" value={overview?.byStatus?.Delayed ?? 0} color="warning" />
        <StatCard icon={FiWifiOff} label="Offline" value={overview?.byStatus?.Offline ?? 0} color="danger" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Fleet Map" subtitle="Real-time bus positions on Mogadishu map" className="lg:col-span-2">
          <FleetMap buses={buses} selectedBusId={selectedBusId} onSelect={setSelectedBusId} />
        </Card>

        <Card title="Selected Bus" subtitle="Click a marker or row to inspect" noPadding>
          {selectedBus ? (
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{selectedBus.bus?.busNumber}</p>
                  <p className="text-sm text-ink-muted">{selectedBus.route?.name}</p>
                </div>
                <Badge status={selectedBus.status} />
              </div>

              <div className="space-y-3 rounded-lg bg-slate-50 p-4 text-sm">
                <div className="flex items-center gap-2 text-ink-variant">
                  <FiNavigation className="h-4 w-4 text-ink-muted" />
                  <span>{selectedBus.currentLocation || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-variant">
                  <FiArrowRight className="h-4 w-4 text-ink-muted" />
                  <span>Next: {selectedBus.nextStop || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-ink-variant">
                  <FiUsers className="h-4 w-4 text-ink-muted" />
                  <span>{selectedBus.passengerCount}/{selectedBus.bus?.capacity ?? '-'} passengers</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-ink-muted">Speed</p>
                  <p className="font-display font-semibold text-ink">{selectedBus.speedKmh} km/h</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-ink-muted">ETA</p>
                  <p className="font-display font-semibold text-ink">{selectedBus.etaMinutes != null ? `${selectedBus.etaMinutes} min` : '-'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-ink-muted">Driver</p>
                  <p className="font-medium text-ink">{selectedBus.driverName || '—'}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-ink-muted">Fuel</p>
                  <p className="font-medium text-ink">{selectedBus.fuelLevel}%</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center text-sm text-ink-muted">No buses to display.</div>
          )}
        </Card>
      </div>

      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by bus, location, next stop..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={TRACKING_STATUS_FILTERS} className="sm:max-w-[170px]" />
        </div>
        <DataTable
          columns={columns}
          data={buses}
          loading={loading}
          keyField="busId"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiTruck className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">Live tracking data is currently unavailable</p>
                <p className="mt-1 text-sm text-ink-muted">Tracking data will appear once buses are in transit.</p>
              </div>
            </div>
          }
          onRowClick={(row) => setSelectedBusId(row.busId)}
        />
      </Card>
    </div>
  );
};

export default AdminTracking;
