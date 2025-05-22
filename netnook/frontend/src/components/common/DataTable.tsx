import React, { useState } from 'react';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | 'actions';
    header: string;
    render?: (item: T) => React.ReactNode;
    sortable?: boolean;
  }[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
}

function DataTable<T extends { id: number | string }>({
  data,
  columns,
  onEdit,
  onDelete,
  onSort,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null;
    direction: 'asc' | 'desc';
  }>({
    key: null,
    direction: 'asc',
  });

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    if (onSort) {
      onSort(key, direction);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key.toString()}
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                      }`}
                      onClick={() => {
                        if (column.sortable && column.key !== 'actions') {
                          handleSort(column.key as keyof T);
                        }
                      }}
                    >
                      <div className="flex items-center">
                        {column.header}
                        {column.sortable && sortConfig.key === column.key && (
                          <span className="ml-1">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500"
                    >
                      Aucune donnée disponible
                    </td>
                  </tr>
                ) : (
                  data.map((item) => (
                    <tr key={item.id.toString()} className="hover:bg-gray-50">
                      {columns.map((column) => (
                        <td
                          key={`${item.id}-${column.key.toString()}`}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        >
                          {column.key === 'actions' ? (
                            <div className="flex space-x-2">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(item)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <PencilIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              )}
                              {onDelete && (
                                <button
                                  onClick={() => onDelete(item)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                </button>
                              )}
                            </div>
                          ) : column.render ? (
                            column.render(item)
                          ) : (
                            (item[column.key as keyof T] as React.ReactNode)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
