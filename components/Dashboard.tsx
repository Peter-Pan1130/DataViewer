'use client';
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useDashboardData } from '../hooks/useDashboardData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard: React.FC = () => {
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/csv');
        if (!response.ok) {
          throw new Error('Failed to fetch CSV data');
        }
        const result = await response.json();
        setJsonData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const {
    yearlyData,
    regionalData,
    hierarchicalData,
    selectedYear,
    selectedRegion,
    selectedCategory,
    handleYearSelect,
    handleRegionSelect,
    handleCategorySelect,
    resetFilters
  } = useDashboardData(jsonData);

  const lineChartData = {
    labels: yearlyData.map(item => item.year.toString()),
    datasets: [
      {
        label: 'Total Stock Value',
        data: yearlyData.map(item => item.value),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointBackgroundColor: yearlyData.map(item => 
          selectedYear === item.year ? '#EC4899' : '#6366F1'
        ),
        pointRadius: yearlyData.map(item => 
          selectedYear === item.year ? 6 : 3
        ),
        pointHoverRadius: 8,
        borderWidth: 2,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        handleYearSelect(yearlyData[index].year);
      }
    },
    plugins: {
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (context: any) => {
            const value = context.raw;
            return `Value: ${value.toFixed(2)}`;
          }
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="mt-4 text-indigo-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="bg-white p-6 rounded-2xl shadow-lg max-w-md">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Error</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
      <div className="max-w-[1900px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            UK ICES Fish Stock Dashboard
          </h1>
          <p className="text-indigo-600">Interactive visualization of fish stock data</p>
        </div>
        
        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 mb-8 border border-indigo-100">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={resetFilters}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
            <div className="flex flex-wrap gap-2">
              {selectedYear && (
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Year: {selectedYear}
                </span>
              )}
              {selectedRegion && (
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Region: {selectedRegion}
                </span>
              )}
              {selectedCategory && (
                <span className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Category: {selectedCategory}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temporal Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Stock Trends Over Time
            </h2>
            <div className="h-[400px]">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Geographical Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stock Distribution by Region
            </h2>
            <div className="h-[400px] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                {regionalData.map(({ region, value }) => (
                  <button
                    key={region}
                    onClick={() => handleRegionSelect(region)}
                    className={`p-4 rounded-xl transition-all duration-200 ${
                      selectedRegion === region 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                        : 'bg-white hover:bg-indigo-50 border border-indigo-100'
                    }`}
                  >
                    <div className="font-semibold mb-1">{region}</div>
                    <div className="text-sm opacity-80">{value.toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hierarchical Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-6 border border-indigo-100 lg:col-span-2">
            <h2 className="text-xl font-semibold text-indigo-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Stock Categories Overview
            </h2>
            <div className="h-[400px] overflow-y-auto pr-2">
              <div className="grid grid-cols-3 gap-6">
                {hierarchicalData.map(({ name, value, children }) => (
                  <div 
                    key={name}
                    className={`rounded-xl p-4 transition-all duration-200 ${
                      selectedCategory === name 
                        ? 'bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-500' 
                        : 'bg-white border border-indigo-100'
                    }`}
                  >
                    <button
                      onClick={() => handleCategorySelect(name)}
                      className={`w-full text-left font-semibold mb-3 flex items-center justify-between ${
                        selectedCategory === name ? 'text-indigo-600' : 'text-indigo-900'
                      }`}
                    >
                      <span>{name}</span>
                      <span className="text-sm font-normal bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">
                        {value.toFixed(2)}
                      </span>
                    </button>
                    <div className="space-y-2">
                      {children.map(({ name: stockName, value: stockValue }) => (
                        <div 
                          key={stockName}
                          className="text-sm p-3 bg-white rounded-lg border border-indigo-100 shadow-sm"
                        >
                          <div className="font-medium text-indigo-900">{stockName}</div>
                          <div className="text-indigo-600 mt-1">{stockValue.toFixed(2)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 