'use client';

import { useState, useEffect } from 'react';
import { DataTable } from '@/components/DataTable';

interface CsvData {
  [key: string]: string;
}

export default function Home() {
  const [data, setData] = useState<CsvData[]>([]);
  const [filteredData, setFilteredData] = useState<CsvData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});

  // Advanced filtering function
  const applyFilters = (data: CsvData[]) => {
    return data.filter(row => {
      return Object.entries(activeFilters).every(([key, value]) => {
        if (!value) return true;
        return row[key]?.toString().toLowerCase().includes(value.toLowerCase());
      });
    });
  };

  // Combined filtering effect
  useEffect(() => {
    let filtered = [...data];
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(row => 
        Object.values(row).some(value => 
          value && value.toString().toLowerCase().includes(term)
        )
      );
    }
    
    // Apply column filters
    filtered = applyFilters(filtered);
    
    setFilteredData(filtered);
  }, [searchTerm, data, activeFilters]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/csv');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data');
        }
        const result = await response.json();
        setData(result.data);
        setFilteredData(result.data);
        
        // Extract column headers from the first row
        if (result.data.length > 0) {
          setColumns(Object.keys(result.data[0]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            CSV Data Viewer
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Viewing data from UK_ICES_fish_stock_and_shellfish_stock_assessment_data_2017.csv
          </p>
        </div>
        
        {/* Search and Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-lg mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search in all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Column Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['Year', 'SpeciesName', 'StockDescription'].map(column => (
              <div key={column} className="relative">
                <input
                  type="text"
                  placeholder={`Filter by ${column}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm"
                  value={activeFilters[column] || ''}
                  onChange={(e) => setActiveFilters(prev => ({
                    ...prev,
                    [column]: e.target.value
                  }))}
                />
                {activeFilters[column] && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setActiveFilters(prev => {
                      const newFilters = { ...prev };
                      delete newFilters[column];
                      return newFilters;
                    })}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="mt-2 text-sm text-gray-500 text-center">
            Showing {filteredData.length} of {data.length} entries
          </div>
        </div>

        {/* Table display */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <DataTable 
            data={filteredData} 
            columns={columns} 
            selectedRow={selectedRow}
            onRowSelect={setSelectedRow}
          />
        )}
      </div>
    </main>
  );
}
