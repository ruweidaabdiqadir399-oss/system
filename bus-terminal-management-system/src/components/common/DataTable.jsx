/**
 * Generic data table. `columns` is an array of
 * { key, header, render?(row), className?, headerClassName? }.
 * When `loading` is true, renders skeleton rows instead of `data`.
 */
const DataTable = ({
  columns,
  data = [],
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  keyField = 'id',
  skeletonRows = 5,
}) => (
  <div className="table-shell">
    <table className="table">
      <thead>
        <tr>
          {columns.map((col) => (
            <th key={col.key} className={col.headerClassName}>
              {col.header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: skeletonRows }).map((_, rowIndex) => (
            <tr key={`skeleton-${rowIndex}`}>
              {columns.map((col) => (
                <td key={col.key}>
                  <div className="skeleton h-4 w-full max-w-[160px]" />
                </td>
              ))}
            </tr>
          ))
        ) : data.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="!border-b-0 py-12 text-center text-sm text-ink-muted">
              {emptyMessage}
            </td>
          </tr>
        ) : (
          data.map((row) => (
            <tr
              key={row[keyField]}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
            >
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default DataTable;
