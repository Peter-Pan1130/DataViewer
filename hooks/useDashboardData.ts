import { useState, useMemo } from 'react';
import { processData } from '../utils/dataProcessor';

interface StockData {
  year: number;
  region: string;
  category: string;
  value: number;
}

interface YearlyData {
  year: number;
  value: number;
}

interface RegionalData {
  region: string;
  value: number;
}

interface HierarchicalData {
  name: string;
  value: number;
  children: { name: string; value: number }[];
}

export const useDashboardData = (jsonData: any[]) => {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const processedData = useMemo(() => processData(jsonData), [jsonData]);

  const filteredData = useMemo(() => {
    let result = processedData;
    if (selectedYear) {
      result = result.filter(item => item.year === selectedYear);
    }
    if (selectedRegion) {
      result = result.filter(item => item.region === selectedRegion);
    }
    if (selectedCategory) {
      result = result.filter(item => item.category === selectedCategory);
    }
    return result;
  }, [processedData, selectedYear, selectedRegion, selectedCategory]);

  const yearlyData = useMemo(() => {
    const yearMap = new Map<number, number>();
    filteredData.forEach(item => {
      const current = yearMap.get(item.year) || 0;
      yearMap.set(item.year, current + item.value);
    });
    return Array.from(yearMap.entries())
      .map(([year, value]) => ({ year, value }))
      .sort((a, b) => a.year - b.year);
  }, [filteredData]);

  const regionalData = useMemo(() => {
    const regionMap = new Map<string, number>();
    filteredData.forEach(item => {
      const current = regionMap.get(item.region) || 0;
      regionMap.set(item.region, current + item.value);
    });
    return Array.from(regionMap.entries())
      .map(([region, value]) => ({ region, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const hierarchicalData = useMemo(() => {
    const categoryMap = new Map<string, { value: number; stocks: Map<string, number> }>();
    filteredData.forEach(item => {
      const category = categoryMap.get(item.category) || { value: 0, stocks: new Map() };
      category.value += item.value;
      const stockValue = category.stocks.get(item.stock) || 0;
      category.stocks.set(item.stock, stockValue + item.value);
      categoryMap.set(item.category, category);
    });

    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      value: data.value,
      children: Array.from(data.stocks.entries())
        .map(([stockName, stockValue]) => ({
          name: stockName,
          value: stockValue
        }))
        .sort((a, b) => b.value - a.value)
    }));
  }, [filteredData]);

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
    resetFilters,
    filteredData
  };
}; 