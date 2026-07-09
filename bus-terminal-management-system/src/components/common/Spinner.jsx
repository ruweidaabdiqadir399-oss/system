const SIZE_CLASS = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => (
  <div
    role="status"
    aria-label="Loading"
    className={`animate-spin rounded-full border-primary-200 border-t-primary-600 ${SIZE_CLASS[size] ?? SIZE_CLASS.md} ${className}`}
  />
);

export default Spinner;
