'use client';

import React, { useState, useCallback } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface DataTableProps {
  data: Record<string, string>[];
  columns: string[];
  selectedRow: string | null;
  onRowSelect: (id: string | null) => void;
  onHover?: (value: string | null) => void;
}

export function DataTable({ data, columns, selectedRow, onRowSelect, onHover }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  } | null>(null);
  
  // Handle pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Handle column filtering
  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col));
  const [showColumnOptions, setShowColumnOptions] = useState(false);

  // Sort the data when sortConfig changes
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      // Check if values are numeric
      const aNum = Number(aValue);
      const bNum = Number(bValue);
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sortConfig.direction === 'ascending' ? aNum - bNum : bNum - aNum;
      }
      
      // String comparison
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Request sort for a specific column
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    
    setSortConfig({ key, direction });
  };

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Column visibility toggle handler
  const toggleColumnVisibility = (column: string) => {
    if (visibleColumns.includes(column)) {
      if (visibleColumns.length > 1) { // Keep at least one column visible
        setVisibleColumns(visibleColumns.filter(col => col !== column));
      }
    } else {
      setVisibleColumns([...visibleColumns, column]);
    }
  };

  const toggleAllColumns = (checked: boolean) => {
    setVisibleColumns(checked ? columns.map(col => col) : []);
  };

  // Calculate visible columns (prioritize important columns, limit to 6 initially)
  const initialVisibleColumns = React.useMemo(() => {
    // Columns we consider particularly important or meaningful
    const priorityColumns = [
      'SpeciesName', 'Year', 'StockSize', 'StockSizeUnits', 'FishStock',
      'StockDescription', 'ICES Areas (tilde delimited)'
    ];
    
    // Filter by priority first, then add others if needed
    let result = columns.filter(col => priorityColumns.includes(col));
    
    // If we have less than 6 columns, add more until we reach 6 or run out
    if (result.length < 6) {
      const remainingColumns = columns.filter(col => !priorityColumns.includes(col));
      result = [...result, ...remainingColumns.slice(0, 6 - result.length)];
    }
    
    return result;
  }, [columns]);

  // Set initial visible columns on first render
  React.useEffect(() => {
    setVisibleColumns(initialVisibleColumns);
  }, [initialVisibleColumns]);

  // Add new state variables for chart controls
  const [selectedChart, setSelectedChart] = useState<'bar' | 'line' | 'pie'>('bar');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);

  // Function to get numeric columns
  const getNumericColumns = useCallback(() => {
    return columns.filter(column => {
      const sampleValue = data[0]?.[column];
      return !isNaN(Number(sampleValue));
    });
  }, [columns, data]);

  // Function to get categorical columns
  const getCategoricalColumns = useCallback(() => {
    return columns.filter(column => {
      const sampleValue = data[0]?.[column];
      return isNaN(Number(sampleValue));
    });
  }, [columns, data]);

  // Function to prepare chart data
  const prepareChartData = useCallback(() => {
    if (!selectedMetric || !selectedCategory) return null;

    const aggregatedData: Record<string, number> = {};
    data.forEach(row => {
      const categoryValue = row[selectedCategory] || 'Unknown';
      const metricValue = Number(row[selectedMetric]) || 0;
      
      if (!aggregatedData[categoryValue]) {
        aggregatedData[categoryValue] = 0;
      }
      aggregatedData[categoryValue] += metricValue;
    });

    const labels = Object.keys(aggregatedData);
    const values = Object.values(aggregatedData);

    const chartData = {
      labels,
      datasets: [{
        label: `${selectedMetric} by ${selectedCategory}`,
        data: values,
        backgroundColor: labels.map((label) => 
          hoveredElement === label || selectedRow === label
            ? 'rgba(99, 102, 241, 0.8)'
            : 'rgba(99, 102, 241, 0.5)'
        ),
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 1,
      }],
    };

    return chartData;
  }, [data, selectedMetric, selectedCategory, hoveredElement, selectedRow]);

  // Chart options with hover and click handlers
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: selectedMetric && selectedCategory ? `${selectedMetric} by ${selectedCategory}` : 'Select metrics to display chart',
      },
    },
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const label = prepareChartData()?.labels[elements[0].index];
        // setHoveredElement(label);
        // onHover?.(label);
      } else {
        setHoveredElement(null);
        onHover?.(null);
      }
    },
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const label = prepareChartData()?.labels[elements[0].index];
        // onRowSelect(label);
      }
    },
  };

  return (
    <div className="space-y-6">
      {/* Column visibility controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Data Table</h2>
        <div className="relative">
          <button
            onClick={() => setShowColumnOptions(!showColumnOptions)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3zm1 0v3.586l4.707 4.707A1 1 0 019 12v4.414l1-1V12a1 1 0 01.293-.707L15 6.586V3H4z" clipRule="evenodd" />
            </svg>
            Column Visibility
          </button>
          
          {showColumnOptions && (
            <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 divide-y divide-gray-100">
              <div className="py-2 px-4">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="toggle-all"
                    checked={visibleColumns.length === columns.length}
                    onChange={(e) => toggleAllColumns(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="toggle-all" className="ml-2 block text-sm text-gray-900 font-medium">
                    Toggle All
                  </label>
                </div>
              </div>
              <div className="py-2 px-4 max-h-60 overflow-y-auto">
                {columns.map((column) => (
                  <div key={column} className="flex items-center py-1.5">
                    <input
                      type="checkbox"
                      id={`column-${column}`}
                      checked={visibleColumns.includes(column)}
                      onChange={() => toggleColumnVisibility(column)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`column-${column}`} className="ml-2 block text-sm text-gray-900 truncate max-w-[200px]">
                      {column}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chart controls */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-md font-medium text-gray-900 mb-3">Data Visualization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
              value={selectedChart}
              onChange={(e) => setSelectedChart(e.target.value as 'bar' | 'line' | 'pie')}
            >
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
            >
              <option value="">Select metric</option>
              {getNumericColumns().map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Select category</option>
              {getCategoricalColumns().map(column => (
                <option key={column} value={column}>{column}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart Display */}
      {prepareChartData() && (
        <div className="h-[400px] border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
          {selectedChart === 'bar' && (
            <Bar data={prepareChartData()!} options={chartOptions} />
          )}
          {selectedChart === 'line' && (
            <Line data={prepareChartData()!} options={chartOptions} />
          )}
          {selectedChart === 'pie' && (
            <Pie data={prepareChartData()!} options={chartOptions} />
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column}
                  className="group px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-150"
                  onClick={() => requestSort(column)}
                >
                  <div className="flex items-center space-x-1">
                    <span className="truncate max-w-[200px]">{column}</span>
                    <span className="text-gray-400 group-hover:text-gray-600 transition-colors duration-150">
                      {sortConfig?.key === column ? (
                        sortConfig.direction === 'ascending' ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        )
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 opacity-0 group-hover:opacity-100" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                        </svg>
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rowIndex) => (
                <tr 
                  key={rowIndex}
                  className={`${selectedRow === row[selectedCategory] ? 'bg-indigo-50' : ''} hover:bg-gray-50 cursor-pointer transition-colors duration-150`}
                  onClick={() => onRowSelect(row[selectedCategory])}
                  onMouseEnter={() => onHover?.(row[selectedCategory])}
                  onMouseLeave={() => onHover?.(null)}
                >
                  {visibleColumns.map((column) => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {row[column]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={visibleColumns.length} className="px-6 py-8 text-center text-sm text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="py-3 flex items-center justify-between border-t border-gray-200">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === 1 
                ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
            } transition-colors duration-150`}
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
            disabled={currentPage === totalPages}
            className={`ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === totalPages 
                ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 bg-white hover:bg-gray-50 border border-gray-300'
            } transition-colors duration-150`}
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * rowsPerPage + 1}</span> to{' '}
              <span className="font-medium">
                {Math.min(currentPage * rowsPerPage, sortedData.length)}
              </span>{' '}
              of <span className="font-medium">{sortedData.length}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                  currentPage === 1 
                    ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                } transition-colors duration-150`}
              >
                <span className="sr-only">Previous</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Simple pagination logic for up to 5 page buttons
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } transition-colors duration-150`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(currentPage < totalPages ? currentPage + 1 : totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                  currentPage === totalPages 
                    ? 'text-gray-300 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-500 bg-white hover:bg-gray-50'
                } transition-colors duration-150`}
              >
                <span className="sr-only">Next</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
