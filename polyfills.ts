// polyfills.ts
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto';

class Crypto {
  getRandomValues = expoCryptoGetRandomValues;
}

// Add crypto to the global scope if it doesn't exist
if (typeof global.crypto === 'undefined') {
  global.crypto = new Crypto();
}