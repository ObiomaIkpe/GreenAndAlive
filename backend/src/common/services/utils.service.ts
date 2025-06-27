import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UtilsService {
  generateId(): string {
    return uuidv4();
  }

  generateHash(data: string): string {
    // Simple hash function - in production, use crypto
    return Buffer.from(data).toString('base64');
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return date.toISOString();
  }

  calculateCarbonFootprint(data: {
    electricity: number;
    transportation: number;
    heating: number;
    airTravel: number;
  }): number {
    // Carbon footprint calculation factors (tons CO2 per unit)
    const factors = {
      electricity: 0.0005, // per kWh
      transportation: 0.0004, // per mile
      heating: 0.0053, // per therm
      airTravel: 0.9, // per flight
    };

    return (
      data.electricity * factors.electricity +
      data.transportation * factors.transportation +
      data.heating * factors.heating +
      data.airTravel * factors.airTravel
    );
  }

  calculateWasteReward(wasteType: string, amount: number, method: string): number {
    const baseRates = {
      organic: { recycling: 2, composting: 3, proper_disposal: 1 },
      recyclable: { recycling: 4, upcycling: 5, proper_disposal: 2 },
      electronic: { recycling: 8, proper_disposal: 4, donation: 6 },
      hazardous: { proper_disposal: 10 },
      general: { proper_disposal: 1 },
    };

    const rate = baseRates[wasteType]?.[method] || 1;
    const multiplier = amount > 50 ? 1.2 : amount > 20 ? 1.1 : 1.0;
    
    return Math.floor(amount * rate * multiplier);
  }
}