import jsPDF from 'jspdf';
import { formatDate, formatTime, formatDateTime } from './formatters';

// Brand palette (matches Tailwind config)
const PRIMARY    = [22,  163, 74];  // #16A34A — Primary
const DARK       = [17,  24,  39];  // #111827 — Headings
const MUTED      = [156, 163, 175]; // #9CA3AF — Muted Text
const BORDER_CLR = [229, 231, 235]; // #E5E7EB — Borders
const BG_LIGHT   = [245, 247, 250]; // #F5F7FA — Main Background

function line(doc, y, W, M) {
  doc.setDrawColor(...BORDER_CLR);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
}

function labelValue(doc, label, value, x, y, gapX) {
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(label, x, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...DARK);
  doc.text(String(value ?? '-'), x + gapX, y);
}

export function buildTicketDoc(ticket) {
  const doc = new jsPDF({ unit: 'mm', format: 'a5', orientation: 'portrait' });
  const W = doc.internal.pageSize.getWidth();  // 148 mm
  const H = doc.internal.pageSize.getHeight(); // 210 mm
  const M = 14;
  let y = 0;

  // ── Header ────────────────────────────────────────────────────────
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('BTMS', M, 14);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('ELECTRONIC TICKET', W - M, 14, { align: 'right' });

  y = 32;

  // ── Route title ───────────────────────────────────────────────────
  doc.setTextColor(...DARK);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(ticket.route?.name ?? 'Bus Trip', M, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const origin = ticket.route?.origin ?? '';
  const dest   = ticket.route?.destination ?? '';
  if (origin || dest) {
    doc.text(`${origin}  ->  ${dest}`, M, y);
    y += 5;
  }
  if (ticket.route?.code) {
    doc.setFontSize(7.5);
    doc.setTextColor(...PRIMARY);
    doc.text(ticket.route.code, M, y);
    y += 4;
  }

  y += 3;
  line(doc, y, W, M);
  y += 8;

  // ── QR Code (right) + Ticket fields (left) ────────────────────────
  const QR_SIZE = 40;
  const qrX = W - M - QR_SIZE;
  const qrStartY = y;

  if (ticket.qrCode) {
    try {
      doc.addImage(ticket.qrCode, 'PNG', qrX, qrStartY, QR_SIZE, QR_SIZE);
    } catch {
      doc.setFillColor(...BG_LIGHT);
      doc.rect(qrX, qrStartY, QR_SIZE, QR_SIZE, 'F');
      doc.setTextColor(...MUTED);
      doc.setFontSize(7);
      doc.text('QR CODE', qrX + QR_SIZE / 2, qrStartY + QR_SIZE / 2, { align: 'center' });
    }
  } else {
    doc.setFillColor(...BG_LIGHT);
    doc.rect(qrX, qrStartY, QR_SIZE, QR_SIZE, 'F');
    doc.setDrawColor(...BORDER_CLR);
    doc.rect(qrX, qrStartY, QR_SIZE, QR_SIZE);
    doc.setTextColor(...MUTED);
    doc.setFontSize(7);
    doc.text('QR CODE', qrX + QR_SIZE / 2, qrStartY + QR_SIZE / 2, { align: 'center' });
  }

  // QR payload text under code image
  if (ticket.qrPayload) {
    const payloadLines = doc.splitTextToSize(ticket.qrPayload, QR_SIZE);
    doc.setFontSize(5.5);
    doc.setFont('courier', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(payloadLines.slice(0, 3), qrX, qrStartY + QR_SIZE + 4);
  }

  // Left column: ticket fields
  const GAP = 26;
  const fields = [
    ['TICKET NO.',  ticket._id ?? ticket.id],
    ['PASSENGER',   ticket.passengerName],
    ['SEAT',        ticket.seatNumber],
    ['TRAVEL DATE', ticket.schedule?.date ? formatDate(ticket.schedule.date) : '-'],
    ['DEPARTURE',   ticket.schedule?.departureTime ? formatTime(ticket.schedule.departureTime) : '-'],
    ['GATE',        ticket.schedule?.gate ?? '-'],
    ['PAYMENT',     ticket.booking?.paymentStatus ?? '-'],
    ['STATUS',      ticket.status],
  ];

  let fy = qrStartY;
  for (const [label, value] of fields) {
    labelValue(doc, label, value, M, fy, GAP);
    fy += 5.5;
  }

  // If bus info is available via schedule
  if (ticket.bus?.busNumber) {
    labelValue(doc, 'BUS', ticket.bus.busNumber, M, fy, GAP);
    fy += 5.5;
  }

  y = Math.max(fy, qrStartY + QR_SIZE) + 10;

  // ── Divider ───────────────────────────────────────────────────────
  line(doc, y, W, M);
  y += 6;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  if (ticket.issuedAt) {
    doc.text(`Issued: ${formatDateTime(ticket.issuedAt)}`, M, y);
  }

  // ── Footer ────────────────────────────────────────────────────────
  doc.setFillColor(...BG_LIGHT);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setDrawColor(...BORDER_CLR);
  doc.setLineWidth(0.3);
  doc.line(0, H - 12, W, H - 12);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text('Bus Terminal Management System  |  Official E-Ticket', W / 2, H - 4.5, { align: 'center' });

  return doc;
}

export function downloadTicketPDF(ticket) {
  const doc = buildTicketDoc(ticket);
  const id = ticket._id ?? ticket.id ?? 'ticket';
  doc.save(`btms-ticket-${id}.pdf`);
}

export function printTicketPDF(ticket) {
  const doc = buildTicketDoc(ticket);
  doc.autoPrint();
  doc.output('dataurlnewwindow');
}
