import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserPreferences } from './entities/user-preferences.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
  ) {}

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preferences'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);
    
    const { password, ...result } = updatedUser;
    return result;
  }

  async updatePreferences(id: string, updatePreferencesDto: UpdatePreferencesDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['preferences'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.preferences) {
      Object.assign(user.preferences, updatePreferencesDto);
      await this.preferencesRepository.save(user.preferences);
    } else {
      const preferences = this.preferencesRepository.create({
        ...updatePreferencesDto,
        user,
      });
      await this.preferencesRepository.save(preferences);
    }

    return this.findOne(id);
  }

  async getUserStats(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: [
        'carbonFootprints',
        'purchases',
        'aiRecommendations',
        'blockchainTransactions',
        'wasteDisposals',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalCarbonFootprints: user.carbonFootprints?.length || 0,
      totalPurchases: user.purchases?.length || 0,
      totalRecommendations: user.aiRecommendations?.length || 0,
      implementedRecommendations: user.aiRecommendations?.filter(r => r.implemented).length || 0,
      totalTransactions: user.blockchainTransactions?.length || 0,
      totalWasteReports: user.wasteDisposals?.length || 0,
      totalCredits: user.totalCredits,
      totalValue: user.totalValue,
      reputationScore: user.reputationScore,
      achievements: user.achievements,
    };
  }

  async updateWalletAddress(id: string, walletAddress: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.walletAddress = walletAddress;
    const updatedUser = await this.userRepository.save(user);
    
    const { password, ...result } = updatedUser;
    return result;
  }
}