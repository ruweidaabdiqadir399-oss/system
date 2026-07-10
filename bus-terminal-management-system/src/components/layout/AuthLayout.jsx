import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTruck } from 'react-icons/fi';
import { APP_FULL_NAME } from '../../utils/constants';
import busHeroImage from '../../Assets/images/Bus-photo.jpg.jpeg';

const STATS = [
  { value: '20+', label: 'Buses' },
  { value: '15', label: 'Routes' },
  { value: '98%', label: 'On-Time' },
];

const AuthLayout = () => (
  <div className="grid min-h-screen lg:grid-cols-2">

    {/* ── LEFT PANEL ── */}
    <div className="relative hidden overflow-hidden lg:block">

      {/* Background image — primary visual */}
      <img
        src={busHeroImage}
        alt="Bus terminal"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />

      {/* Subtle overlay — light enough to let the image dominate */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between p-8 xl:p-10">

        {/* ── Logo ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 backdrop-blur-md">
            <FiTruck className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-sm font-bold tracking-wide text-white">
            {APP_FULL_NAME}
          </span>
        </motion.div>

        {/* ── Bottom: Subtitle + Stats ── */}
        <div className="flex flex-col gap-5">

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-xs text-[13px] leading-relaxed text-white/70"
          >
            Manage buses, routes, schedules and bookings from one platform.
          </motion.p>

          {/* Stat pills */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex gap-2"
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.45 + i * 0.08 }}
                whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.18)' }}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 backdrop-blur-xl transition-colors duration-200"
              >
                <span className="text-sm font-bold text-white">{stat.value}</span>
                <span className="text-[11px] font-medium text-white/60">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>

    {/* ── RIGHT PANEL ── */}
    <div className="flex items-center justify-center bg-surface px-4 py-12 sm:px-6 lg:px-12">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </div>
  </div>
);

export default AuthLayout;
