import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { UtilsService } from './utilsService';
import { authService } from './authService';

export interface CarbonFootprintData {
  electricity: number;
  transportation: number;
  heating: number;
  airTravel: number;
  notes?: string;
}

export interface CarbonFootprint extends CarbonFootprintData {
  id: string;
  userId: string;
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
  private utilsService = new UtilsService();

  async calculateFootprint(data: CarbonFootprintData): Promise<CarbonFootprint> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the backend API to calculate footprint
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/carbon/footprint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          electricity: data.electricity,
          transportation: data.transportation,
          heating: data.heating,
          airTravel: data.airTravel,
          notes: data.notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to calculate carbon footprint');
      }

      const responseData = await response.json();
      const footprint = responseData.footprint;
      
      notificationService.success(
        'Carbon Footprint Calculated',
        `Your carbon footprint is ${footprint.totalEmissions.toFixed(1)} tons CO₂/year`
      );
      
      return {
        id: footprint.id,
        userId: footprint.userId,
        electricity: footprint.electricity,
        transportation: footprint.transportation,
        heating: footprint.heating,
        airTravel: footprint.airTravel,
        totalEmissions: footprint.totalEmissions,
        calculationDate: footprint.calculationDate,
        notes: footprint.notes || undefined,
        createdAt: footprint.createdAt,
        updatedAt: footprint.updatedAt || footprint.createdAt,
      };
    } catch (error) {
      notificationService.error('Calculation Failed', 'Failed to calculate carbon footprint');
      throw error;
    }
  }

  async getFootprintHistory(): Promise<CarbonFootprint[]> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the backend API to get footprint history
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/carbon/footprint`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load carbon footprint history');
      }

      const responseData = await response.json();
      return responseData.footprints;
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon footprint history');
      throw error;
    }
  }

  async getLatestFootprint(): Promise<CarbonFootprint | null> {
    try {
      const currentUser = authService.getUser();
      if (!currentUser) {
        return null;
      }
      
      const token = localStorage.getItem('carbonledgerai_auth_token');
      if (!token) {
        return null;
      }
      
      // Call the backend API to get latest footprint
      const response = await fetch(`${config.api.baseUrl || 'https://carbonledgerai-backend.onrender.com'}/api/carbon/footprint/latest`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load latest carbon footprint');
      }

      const responseData = await response.json();
      return responseData.footprint;
    } catch (error) {
      console.error('Get latest footprint error:', error);
      return null;
    }
  }

  async getCarbonTrend(months: number = 12): Promise<CarbonTrend[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate start date
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      // Get footprint data
      const { data: footprints, error } = await supabase
        .from('carbon_footprints')
        .select('*')
        .eq('user_id', user.id)
        .gte('calculation_date', startDate.toISOString())
        .order('calculation_date', { ascending: true });

      if (error) throw error;
      
      return footprints.map(fp => ({
        date: fp.calculation_date,
        emissions: fp.total_emissions,
        electricity: fp.electricity,
        transportation: fp.transportation,
        heating: fp.heating,
        airTravel: fp.air_travel,
      }));
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon trend data');
      throw error;
    }
  }

  async updateFootprint(id: string, data: Partial<CarbonFootprintData>): Promise<CarbonFootprint> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get existing footprint
      const { data: existingFootprint, error: fetchError } = await supabase
        .from('carbon_footprints')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (fetchError) throw fetchError;

      // Calculate new total emissions
      const updatedData = {
        electricity: data.electricity ?? existingFootprint.electricity,
        transportation: data.transportation ?? existingFootprint.transportation,
        heating: data.heating ?? existingFootprint.heating,
        air_travel: data.airTravel ?? existingFootprint.air_travel,
        notes: data.notes ?? existingFootprint.notes,
      };

      const totalEmissions = this.utilsService.calculateCarbonFootprint({
        electricity: updatedData.electricity,
        transportation: updatedData.transportation,
        heating: updatedData.heating,
        airTravel: updatedData.air_travel,
      });

      // Update footprint
      const { data: footprint, error } = await supabase
        .from('carbon_footprints')
        .update({
          ...updatedData,
          total_emissions: totalEmissions,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      notificationService.success('Footprint Updated', 'Carbon footprint has been updated');
      
      return {
        id: footprint.id,
        userId: footprint.user_id,
        electricity: footprint.electricity,
        transportation: footprint.transportation,
        heating: footprint.heating,
        airTravel: footprint.air_travel,
        totalEmissions: footprint.total_emissions,
        calculationDate: footprint.calculation_date,
        notes: footprint.notes || undefined,
        createdAt: footprint.created_at,
        updatedAt: footprint.updated_at,
      };
    } catch (error) {
      notificationService.error('Update Failed', 'Failed to update carbon footprint');
      throw error;
    }
  }

  async deleteFootprint(id: string): Promise<void> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Delete footprint
      const { error } = await supabase
        .from('carbon_footprints')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      notificationService.success('Footprint Deleted', 'Carbon footprint record has been deleted');
    } catch (error) {
      notificationService.error('Delete Failed', 'Failed to delete carbon footprint');
      throw error;
    }
  }
  
  // Generate mock footprints for development/fallback
  private getMockFootprints(): any[] {
    const currentUser = authService.getUser();
    const userId = currentUser?.id || 'mock-user-id';
    
    return [
      {
        id: 'mock-footprint-1',
        user_id: userId,
        electricity: 800,
        transportation: 1200,
        heating: 100,
        air_travel: 4,
        total_emissions: 32.4,
        calculation_date: new Date().toISOString(),
        notes: 'Monthly calculation',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'mock-footprint-2',
        user_id: userId,
        electricity: 750,
        transportation: 1100,
        heating: 90,
        air_travel: 2,
        total_emissions: 28.6,
        calculation_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Previous month',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }
    ];
  }
}

export const carbonService = new CarbonService();