import { initials } from '../../utils/formatters';

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const COLORS = ['bg-primary-100 text-primary-700', 'bg-secondary-100 text-secondary-700', 'bg-accent-100 text-accent-700'];

const colorFor = (name = '') => COLORS[name.length % COLORS.length];

const Avatar = ({ name = '', src, size = 'md', className = '' }) => {
  const sizeClass = SIZE_CLASS[size] ?? SIZE_CLASS.md;

  if (src) {
    return <img src={src} alt={name} className={`${sizeClass} rounded-full object-cover ${className}`} />;
  }

  return (
    <div className={`flex flex-shrink-0 items-center justify-center rounded-full font-semibold ${sizeClass} ${colorFor(name)} ${className}`}>
      {initials(name) || '?'}
    </div>
  );
};

export default Avatar;
