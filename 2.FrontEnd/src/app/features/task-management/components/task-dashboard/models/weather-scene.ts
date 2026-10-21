/** Cảnh nền banner — kiểu app thời tiết iOS/Android */
export type WeatherScene =
  | 'clear-day'
  | 'clear-night'
  | 'partly-cloudy-day'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy-rain'
  | 'thunderstorm'
  | 'snow';

export function mapWeatherCodeToScene(code: number, isDay: number): WeatherScene {
  if (code === 0) return isDay ? 'clear-day' : 'clear-night';
  if (code === 1) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (code === 2) return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if (code >= 61 && code <= 67) return code >= 65 ? 'heavy-rain' : 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return code === 82 ? 'heavy-rain' : 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return isDay ? 'partly-cloudy-day' : 'partly-cloudy-night';
}
