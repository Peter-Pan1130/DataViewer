import { useState, useEffect } from 'react';
import { FishStockData, processData, aggregateByYear, aggregateByRegion, createHierarchicalData } from '../utils/dataProcessor';

export const useDashboardData = (jsonData: any[]) => {
  const [data, setData] = useState<FishStockData[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const processedData = processData(jsonData);
    setData(processedData);
  }, [jsonData]);

  const filteredData = data.filter(item => {
    if (selectedYear && item.year !== selectedYear) return false;
    if (selectedRegion && item.region !== selectedRegion) return false;
    if (selectedCategory && item.category !== selectedCategory) return false;
    return true;
  });

  const yearlyData = aggregateByYear(filteredData);
  const regionalData = aggregateByRegion(filteredData);
  const hierarchicalData = createHierarchicalData(filteredData);

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
  };

  const resetFilters = () => {
    setSelectedYear(null);
    setSelectedRegion(null);
    setSelectedCategory(null);
  };

  return {
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
  };
}; 