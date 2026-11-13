import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowKey: (row: T) => string;
  searchPlaceholder?: string;
  searchMatcher?: (row: T, query: string) => boolean;
  onRowClick?: (row: T) => void;
  selectedKey?: string;
  maxHeightClass?: string;
  toolbarRight?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  rowKey,
  searchPlaceholder = 'Cari data...',
  searchMatcher,
  onRowClick,
  selectedKey,
  maxHeightClass = 'max-h-[420px]',
  toolbarRight,
}: DataTableProps<T>) {
  const [query, setQuery] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = data;
    if (q && searchMatcher) {
      rows = rows.filter((r) => searchMatcher(r, q));
    }
    if (sortCol) {
      const col = columns.find((c) => c.key === sortCol);
      if (col?.sortValue) {
        const getter = col.sortValue;
        rows = [...rows].sort((a, b) => {
          const va = getter(a);
          const vb = getter(b);
          if (typeof va === 'number' && typeof vb === 'number') {
            return sortDir === 'asc' ? va - vb : vb - va;
          }
          return sortDir === 'asc'
            ? String(va).localeCompare(String(vb))
            : String(vb).localeCompare(String(va));
        });
      }
    }
    return rows;
  }, [data, query, searchMatcher, sortCol, sortDir, columns]);

  const handleSort = (colKey: string, hasSort: boolean) => {
    if (!hasSort) return;
    if (sortCol === colKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(colKey);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
      {(searchMatcher || toolbarRight) && (
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {searchMatcher ? (
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono-num">{filtered.length} baris</span>
            {toolbarRight}
          </div>
        </div>
      )}

      <div className={cn('overflow-auto', maxHeightClass)}>
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900/95 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
            <tr>
              {columns.map((col) => {
                const sortable = Boolean(col.sortValue);
                const isSorted = sortCol === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key, sortable)}
                    className={cn(
                      'px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap select-none',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      sortable && 'cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-200',
                      col.className
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        col.align === 'right' && 'flex-row-reverse'
                      )}
                    >
                      {col.header}
                      {sortable &&
                        (isSorted ? (
                          sortDir === 'asc' ? (
                            <ArrowUp className="w-3 h-3 text-blue-500" />
                          ) : (
                            <ArrowDown className="w-3 h-3 text-blue-500" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-35" />
                        ))}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70 text-xs">
            {filtered.map((row) => {
              const key = rowKey(row);
              const isSelected = selectedKey === key;
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer',
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-500/10'
                      : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3.5 py-2.5 text-zinc-700 dark:text-zinc-300',
                        col.align === 'right' && 'text-right font-mono-num',
                        col.align === 'center' && 'text-center',
                        col.className
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-xs text-zinc-500 dark:text-zinc-400"
                >
                  Tidak ada data yang cocok dengan filter pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

