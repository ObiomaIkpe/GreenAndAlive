import { Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';

@Injectable()
export class ValidationService {
  async validateEntity(entity: any): Promise<void> {
    const errors = await validate(entity);
    if (errors.length > 0) {
      const errorMessages = errors.map(error => 
        Object.values(error.constraints || {}).join(', ')
      ).join('; ');
      throw new BadRequestException(`Validation failed: ${errorMessages}`);
    }
  }

  validateWalletAddress(address: string): boolean {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validateCarbonAmount(amount: number): boolean {
    return typeof amount === 'number' && amount >= 0 && amount <= 10000;
  }

  validateTokenAmount(amount: number): boolean {
    return typeof amount === 'number' && amount > 0 && amount <= 1000000;
  }
}