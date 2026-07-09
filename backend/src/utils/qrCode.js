const QRCode = require('qrcode');

/**
 * Renders the given payload as a base64 PNG data URL, suitable for embedding
 * directly in an <img src> on the frontend without a separate file request.
 */
const generateQrCode = async (payload) => QRCode.toDataURL(String(payload), {
  errorCorrectionLevel: 'M',
  margin: 1,
  width: 256,
});

module.exports = { generateQrCode };
