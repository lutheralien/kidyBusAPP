// src/utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A wrapper for AsyncStorage with error handling and typed data
 */
export const Storage = {
  /**
   * Store a value in storage
   * @param key The key to store under
   * @param value The value to store
   */
  setItem: async <T>(key: string, value: T): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error storing data', error);
      return false;
    }
  },

  /**
   * Get a value from storage
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  getItem: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      console.log('Error retrieving data', error);
      return null;
    }
  },

  /**
   * Remove a value from storage
   * @param key The key to remove
   */
  removeItem: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing data', error);
      return false;
    }
  },

  /**
   * Clear all storage (use with caution)
   */
  clearAll: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing data', error);
      return false;
    }
  },

  /**
   * Get all keys in storage
   */
  getAllKeys: async (): Promise<string[] | null> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys', error);
      return null;
    }
  },
};

export default Storage;

// src/utils/validation.ts
/**
 * Form validation utilities
 */

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

 // Validate phone number (10 digits)
 export const isValidPhoneNumber = (phoneNumber: string): boolean => {
    return /^[0-9]{10}$/.test(phoneNumber);
  };

// Password validation
export const isValidPassword = (password: string): boolean => {
  // Minimum 8 characters, at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return true;
};


// Password strength check
export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  if (!password) return 'weak';
  
  // Strong: At least 8 chars with lowercase, uppercase, number, and special char
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  // Medium: At least 8 chars with letters and numbers
  const mediumRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  
  if (strongRegex.test(password)) {
    return 'strong';
  } else if (mediumRegex.test(password)) {
    return 'medium';
  } else {
    return 'weak';
  }
};

// Name validation
export const isValidName = (name: string): boolean => {
  return name.trim().length >= 2;
};

// Phone number validation (general format)
export const isValidPhone = (phone: string): boolean => {
  // This is a simple check - adjust for your country format
  const phoneRegex = /^\+?[\d\s()-]{8,15}$/;
  return phoneRegex.test(phone);
};

// Required field validation
export const isRequired = (value: string): boolean => {
  return value !== null && value !== undefined && value.trim() !== '';
};

// Min/max length validation
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

// Form field validation with error messages
export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

// Validate a form field with multiple rules
export const validateField = (
  field: string,
  value: string,
  rules: { type: string; message: string; min?: number; max?: number }[]
): ValidationResult => {
  for (const rule of rules) {
    switch (rule.type) {
      case 'required':
        if (!isRequired(value)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      case 'email':
        if (!isValidEmail(value)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      case 'password':
        if (!isValidPassword(value)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      case 'minLength':
        if (rule.min && !hasMinLength(value, rule.min)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      case 'maxLength':
        if (rule.max && !hasMaxLength(value, rule.max)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      case 'phone':
        if (!isValidPhone(value)) {
          return { isValid: false, errorMessage: rule.message };
        }
        break;
      default:
        break;
    }
  }
  
  return { isValid: true, errorMessage: '' };
};