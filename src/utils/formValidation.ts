export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

export class FormValidator {
  private rules: ValidationRules;
  private errors: ValidationErrors = {};

  constructor(rules: ValidationRules) {
    this.rules = rules;
  }

  public validate(data: Record<string, any>): { isValid: boolean; errors: ValidationErrors } {
    this.errors = {};

    for (const [field, rule] of Object.entries(this.rules)) {
      const value = data[field];
      const error = this.validateField(field, value, rule);
      
      if (error) {
        this.errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(this.errors).length === 0,
      errors: { ...this.errors }
    };
  }

  public validateField(field: string, value: any, rule: ValidationRule): string | null {
    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      return `${this.formatFieldName(field)} is required`;
    }

    // Skip other validations if value is empty and not required
    if (!rule.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // Min validation
    if (rule.min !== undefined) {
      if (typeof value === 'number' && value < rule.min) {
        return `${this.formatFieldName(field)} must be at least ${rule.min}`;
      }
      if (typeof value === 'string' && value.length < rule.min) {
        return `${this.formatFieldName(field)} must be at least ${rule.min} characters`;
      }
    }

    // Max validation
    if (rule.max !== undefined) {
      if (typeof value === 'number' && value > rule.max) {
        return `${this.formatFieldName(field)} must be at most ${rule.max}`;
      }
      if (typeof value === 'string' && value.length > rule.max) {
        return `${this.formatFieldName(field)} must be at most ${rule.max} characters`;
      }
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return `${this.formatFieldName(field)} format is invalid`;
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }

  private formatFieldName(field: string): string {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  public getErrors(): ValidationErrors {
    return { ...this.errors };
  }

  public hasErrors(): boolean {
    return Object.keys(this.errors).length > 0;
  }

  public getError(field: string): string | null {
    return this.errors[field] || null;
  }
}

// Common validation rules
export const commonRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    custom: (value: string) => {
      if (value && !value.includes('@')) {
        return 'Please enter a valid email address';
      }
      return null;
    }
  },
  
  positiveNumber: {
    min: 0,
    custom: (value: any) => {
      if (value !== null && value !== undefined && isNaN(Number(value))) {
        return 'Please enter a valid number';
      }
      return null;
    }
  },
  
  carbonAmount: {
    min: 0,
    max: 10000,
    custom: (value: any) => {
      const num = Number(value);
      if (value !== null && value !== undefined && isNaN(num)) {
        return 'Please enter a valid carbon amount';
      }
      if (num < 0) {
        return 'Carbon amount cannot be negative';
      }
      if (num > 10000) {
        return 'Carbon amount seems unusually high. Please verify.';
      }
      return null;
    }
  },
  
  price: {
    min: 0,
    custom: (value: any) => {
      const num = Number(value);
      if (value !== null && value !== undefined && isNaN(num)) {
        return 'Please enter a valid price';
      }
      if (num < 0) {
        return 'Price cannot be negative';
      }
      return null;
    }
  },
  
  quantity: {
    min: 1,
    custom: (value: any) => {
      const num = Number(value);
      if (value !== null && value !== undefined && isNaN(num)) {
        return 'Please enter a valid quantity';
      }
      if (num < 1) {
        return 'Quantity must be at least 1';
      }
      if (!Number.isInteger(num)) {
        return 'Quantity must be a whole number';
      }
      return null;
    }
  }
};

// Pre-built validators for common forms
export const createCarbonCalculatorValidator = () => new FormValidator({
  electricity: commonRules.positiveNumber,
  transportation: commonRules.positiveNumber,
  heating: commonRules.positiveNumber,
  airTravel: commonRules.positiveNumber
});

export const createMarketplacePurchaseValidator = () => new FormValidator({
  quantity: { ...commonRules.quantity, required: true },
  price: { ...commonRules.price, required: true }
});

export const createProfileValidator = () => new FormValidator({
  location: { required: true, min: 2, max: 100 },
  budget: { ...commonRules.positiveNumber, required: true }
});