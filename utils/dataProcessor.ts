import csvtojson from 'csvtojson';

export interface FishStockData {
  year: number;
  stock: string;
  region: string;
  category: string;
  value: number;
  unit: string;
}

export const processCSVData = async (csvData: string): Promise<FishStockData[]> => {
  const jsonData = await csvtojson().fromString(csvData);
  
  return jsonData.map((row: any) => ({
    year: parseInt(row.year),
    stock: row.stock,
    region: row.region,
    category: row.category,
    value: parseFloat(row.value),
    unit: row.unit
  }));
};

export const processData = (jsonData: any[]): FishStockData[] => {
  return jsonData.map((row: any) => ({
    year: parseInt(row.year),
    stock: row.stock,
    region: row.region,
    category: row.category,
    value: parseFloat(row.value),
    unit: row.unit
  }));
};

export const aggregateByYear = (data: FishStockData[]) => {
  const yearMap = new Map<number, number>();
  
  data.forEach(item => {
    const current = yearMap.get(item.year) || 0;
    yearMap.set(item.year, current + item.value);
  });
  
  return Array.from(yearMap.entries()).map(([year, value]) => ({
    year,
    value
  })).sort((a, b) => a.year - b.year);
};

export const aggregateByRegion = (data: FishStockData[]) => {
  const regionMap = new Map<string, number>();
  
  data.forEach(item => {
    const current = regionMap.get(item.region) || 0;
    regionMap.set(item.region, current + item.value);
  });
  
  return Array.from(regionMap.entries()).map(([region, value]) => ({
    region,
    value
  })).sort((a, b) => b.value - a.value);
};

export const createHierarchicalData = (data: FishStockData[]) => {
  const categoryMap = new Map<string, Map<string, number>>();
  
  data.forEach(item => {
    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, new Map());
    }
    const stockMap = categoryMap.get(item.category)!;
    const current = stockMap.get(item.stock) || 0;
    stockMap.set(item.stock, current + item.value);
  });
  
  return Array.from(categoryMap.entries()).map(([category, stockMap]) => ({
    name: category,
    value: Array.from(stockMap.values()).reduce((sum, val) => sum + val, 0),
    children: Array.from(stockMap.entries()).map(([stock, value]) => ({
      name: stock,
      value
    })).sort((a, b) => b.value - a.value)
  })).sort((a, b) => b.value - a.value);
}; 