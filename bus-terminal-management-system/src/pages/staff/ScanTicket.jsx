import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { FiCamera, FiCameraOff, FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import ErrorState from '../../components/common/ErrorState';
import { useToast } from '../../hooks/useToast';
import { getTicketById, boardTicket } from '../../services/ticketService';
import { formatDate, formatTime } from '../../utils/formatters';

const parseQrPayload = (text) => {
  if (text.startsWith('BTMS|')) return text.split('|')[1] ?? text;
  if (text.includes('|')) return text.split('|')[0];
  return text.trim();
};

const isTodayDate = (dateStr) => {
  if (!dateStr) return true;
  const scheduleDay = new Date(dateStr).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  return scheduleDay === today;
};

const TicketInfoCard = ({ ticket, onBoard, boarding, onScanNext }) => {
  const todayMatch = isTodayDate(ticket.schedule?.date);
  const canBoard = ticket.status === 'Valid' && todayMatch;

  return (
    <Card className="mt-6">
      <h3 className="mb-4 text-sm font-semibold text-ink">Scanned Ticket</h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Ticket No.</p>
          <p className="mt-1 text-sm font-semibold text-ink">{ticket._id}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
          <div className="mt-1"><Badge status={ticket.status} /></div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Passenger</p>
          <p className="mt-1 text-sm text-ink">{ticket.passengerName}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Seat</p>
          <p className="mt-1 text-sm font-semibold text-ink">{ticket.seatNumber}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Route</p>
          <p className="mt-1 text-sm text-ink">{ticket.route?.name ?? '-'}</p>
          <p className="text-xs text-ink-muted">{ticket.route?.origin} → {ticket.route?.destination}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Departure</p>
          <p className="mt-1 text-sm text-ink">
            {ticket.schedule
              ? `${formatDate(ticket.schedule.date)} at ${formatTime(ticket.schedule.departureTime)}`
              : '-'}
          </p>
          <p className="text-xs text-ink-muted">Gate {ticket.schedule?.gate ?? '-'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
        {canBoard && (
          <Button
            leftIcon={<FiCheckCircle className="h-4 w-4" />}
            onClick={onBoard}
            isLoading={boarding}
          >
            Confirm Boarding
          </Button>
        )}

        {ticket.status === 'Valid' && !todayMatch && (
          <p className="text-sm text-warning-600">
            Travel date does not match today — boarding not permitted.
          </p>
        )}

        {ticket.status === 'Boarded' && (
          <p className="text-sm font-medium text-success-600">Passenger already boarded.</p>
        )}
        {ticket.status === 'Used' && (
          <p className="text-sm text-ink-muted">Ticket already checked in via another method.</p>
        )}
        {ticket.status === 'Cancelled' && (
          <p className="text-sm text-danger-600">This ticket has been cancelled.</p>
        )}

        <Button
          variant="secondary"
          leftIcon={<FiRefreshCw className="h-4 w-4" />}
          onClick={onScanNext}
        >
          Scan Next
        </Button>
      </div>
    </Card>
  );
};

const ScanTicket = () => {
  const toast = useToast();
  const videoRef = useRef(null);
  const controlsRef = useRef(null);
  const processingRef = useRef(false);
  const [scanning, setScanning] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [boarding, setBoarding] = useState(false);

  const stopScan = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.stop();
      controlsRef.current = null;
    }
    processingRef.current = false;
    setScanning(false);
  }, []);

  useEffect(() => () => stopScan(), [stopScan]);

  const startScan = useCallback(async () => {
    setTicket(null);
    setLookupError(null);
    processingRef.current = false;
    setScanning(true);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      const video = videoRef.current;
      video.srcObject = stream;

      // Wait for videoWidth/videoHeight to be populated before creating the scan canvas.
      // The library creates the canvas once at startup; if dimensions are 0 at that moment
      // (play() can resolve before the browser decodes the first frame), all decode attempts
      // operate on a permanent 0×0 canvas and never detect anything.
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('timeout')), 10000);
        video.addEventListener('loadedmetadata', () => { clearTimeout(t); resolve(); }, { once: true });
      });

      await video.play();

      const reader = new BrowserQRCodeReader();
      const controls = reader.scan(
        video,
        (result) => {
          if (!result || processingRef.current) return;
          processingRef.current = true;
          controlsRef.current?.stop();
          controlsRef.current = null;
          setScanning(false);
          const ticketId = parseQrPayload(result.getText());
          getTicketById(ticketId)
            .then((t) => setTicket(t))
            .catch((e) =>
              setLookupError(e?.response?.data?.message || 'Ticket not found for this QR code.')
            )
            .finally(() => { processingRef.current = false; });
        },
        () => {
          stream.getTracks().forEach((track) => track.stop());
          video.srcObject = null;
        },
      );

      controlsRef.current = controls;
    } catch {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      setScanning(false);
      setLookupError('Unable to access camera. Please allow camera permissions and try again.');
    }
  }, []);

  const handleBoard = async () => {
    if (!ticket) return;
    setBoarding(true);
    try {
      const updated = await boardTicket(ticket._id);
      setTicket(updated);
      toast.success(`${ticket.passengerName} boarded successfully.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Boarding failed. Please try again.');
    } finally {
      setBoarding(false);
    }
  };

  const handleScanNext = () => {
    setTicket(null);
    setLookupError(null);
    startScan();
  };

  return (
    <div>
      <PageHeader
        title="Scan Ticket"
        subtitle="Point the camera at a passenger's QR code to verify and confirm boarding."
      />

      <Card>
        <div className="flex gap-3">
          {!scanning ? (
            <Button leftIcon={<FiCamera className="h-4 w-4" />} onClick={startScan}>
              Start Camera
            </Button>
          ) : (
            <Button
              leftIcon={<FiCameraOff className="h-4 w-4" />}
              variant="secondary"
              onClick={stopScan}
            >
              Stop Camera
            </Button>
          )}
        </div>

        <div
          className="relative mt-5 overflow-hidden rounded-xl bg-black"
          style={{ display: scanning ? 'block' : 'none' }}
        >
          <video ref={videoRef} className="w-full" muted playsInline />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-56">
              <span className="absolute left-0 top-0 h-10 w-10 rounded-tl border-l-4 border-t-4 border-white" />
              <span className="absolute right-0 top-0 h-10 w-10 rounded-tr border-r-4 border-t-4 border-white" />
              <span className="absolute bottom-0 left-0 h-10 w-10 rounded-bl border-b-4 border-l-4 border-white" />
              <span className="absolute bottom-0 right-0 h-10 w-10 rounded-br border-b-4 border-r-4 border-white" />
            </div>
          </div>
        </div>

        {lookupError && (
          <ErrorState
            title="Scan failed"
            message={lookupError}
            onRetry={startScan}
            className="mt-4 py-6"
          />
        )}
      </Card>

      {ticket && (
        <TicketInfoCard
          ticket={ticket}
          onBoard={handleBoard}
          boarding={boarding}
          onScanNext={handleScanNext}
        />
      )}
    </div>
  );
};

export default ScanTicket;
