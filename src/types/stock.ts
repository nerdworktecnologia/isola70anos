export interface StockItem {
  id: string;
  name: string;
  unit: string; // ex: garrafas, latas, litros
  currentQty: number;
  targetQty: number;
  photos: string[]; // Data URLs
  notes?: string;
  updatedAt: number;
}

export type StockList = StockItem[];
