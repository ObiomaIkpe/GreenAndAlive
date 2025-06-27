import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarbonFootprint } from './entities/carbon-footprint.entity';
import { User } from '../users/entities/user.entity';
import { CreateCarbonFootprintDto } from './dto/create-carbon-footprint.dto';
import { UpdateCarbonFootprintDto } from './dto/update-carbon-footprint.dto';
import { UtilsService } from '../common/services/utils.service';

@Injectable()
export class CarbonService {
  constructor(
    @InjectRepository(CarbonFootprint)
    private carbonFootprintRepository: Repository<CarbonFootprint>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private utilsService: UtilsService,
  ) {}

  async create(userId: string, createCarbonFootprintDto: CreateCarbonFootprintDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const totalEmissions = this.utilsService.calculateCarbonFootprint(createCarbonFootprintDto);

    const carbonFootprint = this.carbonFootprintRepository.create({
      ...createCarbonFootprintDto,
      totalEmissions,
      calculationDate: new Date(),
      userId,
    });

    return this.carbonFootprintRepository.save(carbonFootprint);
  }

  async findAll(userId: string) {
    return this.carbonFootprintRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string) {
    const carbonFootprint = await this.carbonFootprintRepository.findOne({
      where: { id, userId },
    });

    if (!carbonFootprint) {
      throw new NotFoundException('Carbon footprint record not found');
    }

    return carbonFootprint;
  }

  async update(id: string, userId: string, updateCarbonFootprintDto: UpdateCarbonFootprintDto) {
    const carbonFootprint = await this.findOne(id, userId);

    const totalEmissions = this.utilsService.calculateCarbonFootprint({
      electricity: updateCarbonFootprintDto.electricity ?? carbonFootprint.electricity,
      transportation: updateCarbonFootprintDto.transportation ?? carbonFootprint.transportation,
      heating: updateCarbonFootprintDto.heating ?? carbonFootprint.heating,
      airTravel: updateCarbonFootprintDto.airTravel ?? carbonFootprint.airTravel,
    });

    Object.assign(carbonFootprint, updateCarbonFootprintDto, { totalEmissions });
    return this.carbonFootprintRepository.save(carbonFootprint);
  }

  async remove(id: string, userId: string) {
    const carbonFootprint = await this.findOne(id, userId);
    return this.carbonFootprintRepository.remove(carbonFootprint);
  }

  async getLatest(userId: string) {
    return this.carbonFootprintRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getMonthlyTrend(userId: string, months: number = 12) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return this.carbonFootprintRepository
      .createQueryBuilder('cf')
      .select([
        'EXTRACT(YEAR FROM cf.calculationDate) as year',
        'EXTRACT(MONTH FROM cf.calculationDate) as month',
        'AVG(cf.totalEmissions) as avgEmissions',
        'COUNT(*) as count',
      ])
      .where('cf.userId = :userId', { userId })
      .andWhere('cf.calculationDate >= :startDate', { startDate })
      .groupBy('EXTRACT(YEAR FROM cf.calculationDate), EXTRACT(MONTH FROM cf.calculationDate)')
      .orderBy('year, month')
      .getRawMany();
  }
}