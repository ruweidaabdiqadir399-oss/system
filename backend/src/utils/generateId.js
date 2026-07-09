const Counter = require('../models/Counter');

/**
 * Generates a sequential, human-friendly ID such as `USR-1009` or `BK-100015`.
 *
 * @param {string} key   Counter key, e.g. 'USR', 'BUS', 'BK'.
 * @param {string} prefix Prefix to prepend to the sequence number, e.g. 'USR-'.
 * @param {number} start  Initial sequence value used the first time this key is requested.
 * @param {number} pad    Minimum digit width (zero-padded).
 */
const generateId = async (key, prefix, start = 1, pad = 0) => {
  const counter = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  // First time this counter is used, jump to `start` instead of 1.
  let seq = counter.seq;
  if (seq === 1 && start > 1) {
    await Counter.findByIdAndUpdate(key, { seq: start });
    seq = start;
  }

  const num = pad ? String(seq).padStart(pad, '0') : String(seq);
  return `${prefix}${num}`;
};

module.exports = generateId;
