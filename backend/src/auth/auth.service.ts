import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from '../users/entities/user.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ValidationService } from '../common/services/validation.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserPreferences)
    private preferencesRepository: Repository<UserPreferences>,
    private jwtService: JwtService,
    private validationService: ValidationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName, walletAddress } = registerDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Validate wallet address if provided
    if (walletAddress && !this.validationService.validateWalletAddress(walletAddress)) {
      throw new UnauthorizedException('Invalid wallet address format');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user preferences
    const preferences = this.preferencesRepository.create({
      location: 'San Francisco, CA',
      lifestyle: ['urban', 'tech_worker'],
      budget: 500,
      notifications: true,
      theme: 'light',
      preferences: ['renewable_energy', 'forest_conservation'],
      riskTolerance: 'medium',
    });

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      walletAddress,
      preferences,
      totalCredits: 0,
      totalValue: 0,
      monthlyOffset: 0,
      reductionGoal: 24,
      tokenBalance: 0,
      stakingRewards: 0,
      reputationScore: 50,
      achievements: [],
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = { sub: savedUser.id, email: savedUser.email };
    const token = this.jwtService.sign(payload);

    return {
      user: this.sanitizeUser(savedUser),
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['preferences'],
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return this.sanitizeUser(user);
    }
    return null;
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['preferences'],
    });
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}