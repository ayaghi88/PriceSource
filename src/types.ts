export interface RetailOffer {
  storeName: string;
  price: string;
  shippingInfo: string;
  variations?: string;
  discountInfo?: string;
  storeUrl?: string;
  notes?: string;
  itemImageUrl?: string;
}

export interface ComparisonData {
  itemName: string;
  description: string;
  offers: RetailOffer[];
  comparisonSummary: string;
  buyingTips: string[];
  productImageQuery?: string;
}

export interface GroundingSource {
  id: number;
  title: string;
  uri: string;
}

export interface HistoryItem {
  id: string;
  query: string;
  timestamp: string;
  data: ComparisonData;
  sources: GroundingSource[];
  isQuotaExceeded?: boolean;
}
