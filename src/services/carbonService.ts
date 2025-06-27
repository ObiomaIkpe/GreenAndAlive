import { apiService } from './api';
import { notificationService } from './notificationService';

export interface CarbonFootprintData {
  electricity: number;
  transportation: number;
  heating: number;
  airTravel: number;
  notes?: string;
}

export interface CarbonFootprint extends CarbonFootprintData {
  id: string;
  totalEmissions: number;
  calculationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarbonTrend {
  date: string;
  emissions: number;
  electricity: number;
  transportation: number;
  heating: number;
  airTravel: number;
}

class CarbonService {
  async calculateFootprint(data: CarbonFootprintData): Promise<CarbonFootprint> {
    try {
      const footprint = await apiService.post<CarbonFootprint>('/carbon/footprint', data);
      
      notificationService.success(
        'Carbon Footprint Calculated',
        `Your carbon footprint is ${footprint.totalEmissions.toFixed(1)} tons CO₂/year`
      );
      
      return footprint;
    } catch (error) {
      notificationService.error('Calculation Failed', 'Failed to calculate carbon footprint');
      throw error;
    }
  }

  async getFootprintHistory(): Promise<CarbonFootprint[]> {
    try {
      return await apiService.get<CarbonFootprint[]>('/carbon/footprint');
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon footprint history');
      throw error;
    }
  }

  async getLatestFootprint(): Promise<CarbonFootprint | null> {
    try {
      return await apiService.get<CarbonFootprint>('/carbon/footprint/latest');
    } catch (error) {
      return null;
    }
  }

  async getCarbonTrend(months: number = 12): Promise<CarbonTrend[]> {
    try {
      return await apiService.get<CarbonTrend[]>(`/carbon/footprint/trend?months=${months}`);
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon trend data');
      throw error;
    }
  }

  async updateFootprint(id: string, data: Partial<CarbonFootprintData>): Promise<CarbonFootprint> {
    try {
      const footprint = await apiService.patch<CarbonFootprint>(`/carbon/footprint/${id}`, data);
      
      notificationService.success('Footprint Updated', 'Carbon footprint has been updated');
      
      return footprint;
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update carbon footprint');
      throw error;
    }
  }

  async deleteFootprint(id: string): Promise<void> {
    try {
      await apiService.delete(`/carbon/footprint/${id}`);
      
      notificationService.success('Footprint Deleted', 'Carbon footprint record has been deleted');
    } catch (error) {
      notificationService.error('Delete Failed', 'Failed to delete carbon footprint');
      throw error;
    }
  }
}

export const carbonService = new CarbonService();