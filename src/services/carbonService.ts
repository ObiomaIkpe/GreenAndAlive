import { supabase } from './supabaseClient';
import { notificationService } from './notificationService';
import { UtilsService } from './utilsService';

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
      // Calculate total emissions
      const totalEmissions = this.utilsService.calculateCarbonFootprint(data);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert into database
      const { data: footprint, error } = await supabase
        .from('carbon_footprints')
        .insert({
          user_id: user.id,
          electricity: data.electricity,
          transportation: data.transportation,
          heating: data.heating,
          air_travel: data.airTravel,
          total_emissions: totalEmissions,
          calculation_date: new Date().toISOString(),
          notes: data.notes,
        })
        .select()
        .single();

      if (error) throw error;
      
      notificationService.success(
        'Carbon Footprint Calculated',
        `Your carbon footprint is ${totalEmissions.toFixed(1)} tons CO₂/year`
      );
      
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
      notificationService.error('Calculation Failed', 'Failed to calculate carbon footprint');
      throw error;
    }
  }

  async getFootprintHistory(): Promise<CarbonFootprint[]> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get footprint history
      const { data: footprints, error } = await supabase
        .from('carbon_footprints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return footprints.map(fp => ({
        id: fp.id,
        userId: fp.user_id,
        electricity: fp.electricity,
        transportation: fp.transportation,
        heating: fp.heating,
        airTravel: fp.air_travel,
        totalEmissions: fp.total_emissions,
        calculationDate: fp.calculation_date,
        notes: fp.notes || undefined,
        createdAt: fp.created_at,
        updatedAt: fp.updated_at,
      }));
    } catch (error) {
      notificationService.error('Load Failed', 'Failed to load carbon footprint history');
      throw error;
    }
  }

  async getLatestFootprint(): Promise<CarbonFootprint | null> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get latest footprint
      const { data: footprint, error } = await supabase
        .from('carbon_footprints')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw error;
      }
      
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
}

export const carbonService = new CarbonService();