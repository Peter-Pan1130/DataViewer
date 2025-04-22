import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csvtojson';

export async function GET(req: NextRequest) {
  try {
    const csvFilePath = path.join(process.cwd(), 'UK_ICES_fish_stock_and_shellfish_stock_assessment_data_2017.csv');
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');
    
    const jsonData = await csv().fromString(csvData);
    
    return NextResponse.json({ data: jsonData }, { status: 200 });
  } catch (error) {
    console.error('Error reading CSV file:', error);
    return NextResponse.json({ error: 'Failed to read CSV file' }, { status: 500 });
  }
}
