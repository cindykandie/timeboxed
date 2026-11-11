export const cities = [
  { id: 'nairobi', name: 'Nairobi', country: 'Kenya', timeZone: 'Africa/Nairobi' },
  { id: 'london', name: 'London', country: 'United Kingdom', timeZone: 'Europe/London' },
  { id: 'new-york', name: 'New York', country: 'United States', timeZone: 'America/New_York' },
  { id: 'los-angeles', name: 'Los Angeles', country: 'United States', timeZone: 'America/Los_Angeles' },
  { id: 'toronto', name: 'Toronto', country: 'Canada', timeZone: 'America/Toronto' },
  { id: 'dubai', name: 'Dubai', country: 'United Arab Emirates', timeZone: 'Asia/Dubai' },
  { id: 'mumbai', name: 'Mumbai', country: 'India', timeZone: 'Asia/Kolkata' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', timeZone: 'Asia/Tokyo' },
  { id: 'singapore', name: 'Singapore', country: 'Singapore', timeZone: 'Asia/Singapore' },
  { id: 'sydney', name: 'Sydney', country: 'Australia', timeZone: 'Australia/Sydney' },
  { id: 'johannesburg', name: 'Johannesburg', country: 'South Africa', timeZone: 'Africa/Johannesburg' },
  { id: 'lagos', name: 'Lagos', country: 'Nigeria', timeZone: 'Africa/Lagos' },
  { id: 'paris', name: 'Paris', country: 'France', timeZone: 'Europe/Paris' },
  { id: 'hong-kong', name: 'Hong Kong', country: 'China', timeZone: 'Asia/Hong_Kong' },
] as const;

export type CityId = typeof cities[number]['id'];
export type City = { id: string; name: string; country: string; timeZone: string };
export const defaultCities: readonly CityId[] = ['nairobi', 'london', 'new-york', 'tokyo'];
export const isCityId = (value: unknown): value is CityId => cities.some((city) => city.id === value);
export const getCity = (id: CityId) => cities.find((city) => city.id === id)!;
