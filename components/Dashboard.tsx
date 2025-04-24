'use client';
import React, { useEffect, useState, useCallback } from 'react';
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

interface StockData {
  year: number;
  region: string;
  category: string;
  value: number;
}

interface YearlyData {
  year: number;
  value: number;
  highlightedValue?: number;
}

interface RegionalData {
  region: string;
  value: number;
  highlightedValue?: number;
}

const Dashboard: React.FC = () => {
  const [jsonData, setJsonData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<{ type: 'year' | 'region', value: string | number } | null>(null);

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
    selectedYear,
    selectedRegion,
    handleYearSelect,
    handleRegionSelect,
    resetFilters,
    filteredData
  } = useDashboardData(jsonData);

  const yearlyDataTyped = yearlyData as YearlyData[];
  const regionalDataTyped = regionalData as RegionalData[];

  const handleHover = useCallback((type: 'year' | 'region', value: string | number) => {
    setHoveredItem({ type, value });
  }, []);

  const handleHoverLeave = useCallback(() => {
    setHoveredItem(null);
  }, []);

  const getHighlightedData = useCallback(() => {
    if (!hoveredItem) return null;
    
    switch (hoveredItem.type) {
      case 'year':
        return filteredData.filter((item: StockData) => item.year === hoveredItem.value);
      case 'region':
        return filteredData.filter((item: StockData) => item.region === hoveredItem.value);
      default:
        return null;
    }
  }, [hoveredItem, filteredData]);

  const highlightedData = getHighlightedData();

  const getHighlightedYearlyData = useCallback(() => {
    if (!highlightedData) return yearlyDataTyped;
    
    const yearTotals = new Map<number, number>();
    highlightedData.forEach((item: StockData) => {
      const current = yearTotals.get(item.year) || 0;
      yearTotals.set(item.year, current + item.value);
    });
    
    return yearlyDataTyped.map(item => ({
      ...item,
      highlightedValue: yearTotals.get(item.year) || 0
    }));
  }, [highlightedData, yearlyDataTyped]);

  const getHighlightedRegionalData = useCallback(() => {
    if (!highlightedData) return regionalDataTyped;
    
    const regionTotals = new Map<string, number>();
    highlightedData.forEach((item: StockData) => {
      const current = regionTotals.get(item.region) || 0;
      regionTotals.set(item.region, current + item.value);
    });
    
    return regionalDataTyped.map(item => ({
      ...item,
      highlightedValue: regionTotals.get(item.region) || 0
    }));
  }, [highlightedData, regionalDataTyped]);

  const highlightedYearlyData = getHighlightedYearlyData();
  const highlightedRegionalData = getHighlightedRegionalData();

  const lineChartData = {
    labels: yearlyData.map(item => item.year.toString()),
    datasets: [
      {
        label: 'Total Stock Value',
        data: yearlyData.map(item => item.value),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        pointBackgroundColor: yearlyData.map(item => {
          if (selectedYear === item.year) return '#EC4899';
          if (hoveredItem?.type === 'year' && hoveredItem.value === item.year) return '#F59E0B';
          return '#6366F1';
        }),
        pointRadius: yearlyData.map(item => {
          if (selectedYear === item.year) return 6;
          if (hoveredItem?.type === 'year' && hoveredItem.value === item.year) return 5;
          return 3;
        }),
        pointHoverRadius: 8,
        borderWidth: 2,
        fill: true,
      },
      ...(highlightedData ? [{
        label: 'Highlighted Value',
        data: highlightedYearlyData.map(item => item.highlightedValue),
        borderColor: '#F59E0B',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        borderDash: [5, 5],
        fill: true,
      }] : []),
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
    onHover: (event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        handleHover('year', yearlyData[index].year);
      } else {
        handleHoverLeave();
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
            const year = yearlyData[context.dataIndex].year;
            const relatedData = filteredData.filter((item: StockData) => item.year === year);
            const regions = new Set(relatedData.map((item: StockData) => item.region));
            const highlightedValue = highlightedYearlyData[context.dataIndex].highlightedValue ?? 0;
            
            const labels = [
              `Total Value: ${value.toFixed(2)}`,
              `Regions: ${regions.size}`
            ];
            
            if (highlightedData) {
              labels.push(`Highlighted Value: ${highlightedValue.toFixed(2)}`);
            }
            
            return labels;
          }
        }
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 10
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        title: {
          display: true,
          text: 'Stock Value',
          color: '#6366F1',
          font: {
            size: 10
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        title: {
          display: true,
          text: 'Year',
          color: '#6366F1',
          font: {
            size: 10
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="h-[1900px] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
          <p className="mt-4 text-indigo-600 font-medium">Loading data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[1900px] flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
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
    <div className="h-[1900px] w-[1900px] bg-gradient-to-br from-indigo-50 to-purple-50 p-4 overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header Section */}
        <div className="flex-none mb-3">
          <div className="text-center">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              UK ICES Fish Stock Dashboard
            </h1>
            <p className="text-indigo-600 text-xs">Interactive visualization of fish stock data</p>
          </div>
        </div>
        
        {/* Filters Section */}
        <div className="flex-none bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-3 mb-3 border border-indigo-100">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={resetFilters}
              className="px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-sm flex items-center gap-1.5 text-xs"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Filters
            </button>
            <div className="flex flex-wrap gap-1.5">
              {selectedYear && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg flex items-center gap-1.5 text-xs">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Year: {selectedYear}
                </span>
              )}
              {selectedRegion && (
                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg flex items-center gap-1.5 text-xs">
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Region: {selectedRegion}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Section */}
        <div className="flex-1 grid grid-cols-2 gap-3 overflow-hidden">
          {/* Temporal Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-indigo-100 flex flex-col">
            <h2 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              Stock Trends Over Time
            </h2>
            <div className="flex-1 min-h-0">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>

          {/* Geographical Visualization */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm p-3 border border-indigo-100 flex flex-col">
            <h2 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Stock Distribution by Region
            </h2>
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                {regionalData.map(({ region, value }) => {
                  const totalValue = regionalData.reduce((sum, item) => sum + item.value, 0);
                  const percentage = ((value / totalValue) * 100).toFixed(1);
                  const highlightedItem = highlightedRegionalData.find(item => item.region === region);
                  const highlightedPercentage = highlightedItem?.highlightedValue 
                    ? ((highlightedItem.highlightedValue / value) * 100).toFixed(1)
                    : '0';
                  
                  return (
                    <button
                      key={region}
                      onClick={() => handleRegionSelect(region)}
                      onMouseEnter={() => handleHover('region', region)}
                      onMouseLeave={handleHoverLeave}
                      className={`p-2 rounded-lg transition-all duration-200 ${
                        selectedRegion === region 
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                          : hoveredItem?.type === 'region' && hoveredItem.value === region
                          ? 'bg-indigo-100 border-2 border-indigo-300'
                          : 'bg-white hover:bg-indigo-50 border border-indigo-100'
                      }`}
                    >
                      <div className="font-semibold text-xs">{region}</div>
                      <div className="text-[10px] opacity-80">{value.toFixed(2)}</div>
                      <div className="w-full h-1 mt-1.5 bg-indigo-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="text-[10px] text-indigo-600 mt-0.5">{percentage}% of total</div>
                      {highlightedData && (
                        <>
                          <div className="w-full h-1 mt-1 bg-indigo-50 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full transition-all duration-300"
                              style={{ width: `${highlightedPercentage}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-amber-600 mt-0.5">
                            {highlightedPercentage}% highlighted
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 