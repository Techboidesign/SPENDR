/**
 * Storage utility - namespaced localStorage wrapper for Spendr app
 */

const NAMESPACE = 'spendr';

function getKey(key: string): string {
  return `${NAMESPACE}.${key}`;
}

export function getItem<T>(key: string): T | null {
  try {
    const value = localStorage.getItem(getKey(key));
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return null;
  }
}

export function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(getKey(key), JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage (${key}):`, error);
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(getKey(key));
  } catch (error) {
    console.error(`Error removing from localStorage (${key}):`, error);
  }
}

export function clear(): void {
  try {
    // Only clear our namespaced keys
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${NAMESPACE}.`)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}
