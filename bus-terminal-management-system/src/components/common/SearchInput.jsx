import { FiSearch, FiX } from 'react-icons/fi';

const SearchInput = ({ value, onChange, placeholder = 'Search...', className = '' }) => (
  <div className={`relative ${className}`}>
    <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="input pl-9 pr-9"
    />
    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted transition hover:text-ink"
        aria-label="Clear search"
      >
        <FiX className="h-4 w-4" />
      </button>
    )}
  </div>
);

export default SearchInput;
