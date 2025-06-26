export interface CarbonCredit {
  id: string;
  type: 'forest' | 'renewable' | 'efficiency' | 'capture';
  price: number;
  quantity: number;
  location: string;
  verified: boolean;
  description: string;
  vintage: number;
  seller: string;
  certification: string;
}

export interface UserPortfolio {
  totalCredits: number;
  totalValue: number;
  monthlyOffset: number;
  carbonFootprint: number;
  reductionGoal: number;
  achievements: string[];
}

export interface AIRecommendation {
  id: string;
  type: 'reduction' | 'purchase' | 'optimization';
  title: string;
  description: string;
  impact: number;
  confidence: number;
  category: string;
}

export interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'offset';
  amount: number;
  credits: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}