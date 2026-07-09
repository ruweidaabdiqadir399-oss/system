import Spinner from './Spinner';

const PageLoader = ({ label = 'Loading...' }) => (
  <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-muted">
    <Spinner size="lg" />
    <p className="text-sm font-medium">{label}</p>
  </div>
);

export default PageLoader;
