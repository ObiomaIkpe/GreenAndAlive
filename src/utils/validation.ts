export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  walletAddress: (address: string): boolean => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    return addressRegex.test(address);
  },

  positiveNumber: (value: number): boolean => {
    return typeof value === 'number' && value > 0 && !isNaN(value);
  },

  carbonAmount: (amount: number): boolean => {
    return validators.positiveNumber(amount) && amount <= 10000; // Max 10,000 tons
  },

  tokenAmount: (amount: number): boolean => {
    return validators.positiveNumber(amount) && amount <= 1000000; // Max 1M tokens
  },

  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  }
};

export const validateCarbonCalculation = (data: {
  electricity: number;
  transportation: number;
  heating: number;
  airTravel: number;
}): void => {
  if (!validators.positiveNumber(data.electricity)) {
    throw new ValidationError('Electricity usage must be a positive number');
  }
  if (!validators.positiveNumber(data.transportation)) {
    throw new ValidationError('Transportation distance must be a positive number');
  }
  if (!validators.positiveNumber(data.heating)) {
    throw new ValidationError('Heating usage must be a positive number');
  }
  if (!validators.positiveNumber(data.airTravel)) {
    throw new ValidationError('Air travel must be a positive number');
  }
};

export const validateCreditPurchase = (data: {
  creditId: string;
  quantity: number;
  price: number;
}): void => {
  if (!validators.required(data.creditId)) {
    throw new ValidationError('Credit ID is required');
  }
  if (!validators.positiveNumber(data.quantity)) {
    throw new ValidationError('Quantity must be a positive number');
  }
  if (!validators.positiveNumber(data.price)) {
    throw new ValidationError('Price must be a positive number');
  }
};