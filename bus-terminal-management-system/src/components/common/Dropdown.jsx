import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ALIGN_CLASS = {
  left: 'left-0',
  right: 'right-0',
};

/**
 * Generic click-to-toggle menu. `trigger` is rendered as-is; `children`
 * can be a node or a render function `({ close }) => node` so menu items
 * can close the dropdown after handling their own click.
 */
const Dropdown = ({ trigger, children, align = 'right', menuClassName = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setOpen((prev) => !prev)}>{trigger}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-30 mt-2 min-w-[220px] rounded-lg border border-slate-100 bg-white py-1.5 shadow-popover ${ALIGN_CLASS[align] ?? ALIGN_CLASS.right} ${menuClassName}`}
          >
            {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ icon, children, onClick, danger = false, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors hover:bg-slate-50 ${
      danger ? 'text-danger-600' : 'text-ink-variant'
    } ${className}`}
  >
    {icon}
    {children}
  </button>
);

export const DropdownDivider = () => <div className="my-1.5 border-t border-slate-100" />;

export default Dropdown;
