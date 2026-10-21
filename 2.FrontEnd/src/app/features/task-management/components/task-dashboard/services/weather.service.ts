import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

const WMO_MAP: Record<number, string> = {
  0: 'Quang đãng', 1: 'Chủ yếu quang', 2: 'Nhiều mây', 3: 'Âm u',
  45: 'Sương mù', 48: 'Sương mù dày', 51: 'Mưa phùn nhẹ', 53: 'Mưa phùn',
  55: 'Mưa phùn dày', 61: 'Mưa nhẹ', 63: 'Mưa vừa', 65: 'Mưa to',
  71: 'Tuyết nhẹ', 73: 'Tuyết vừa', 75: 'Tuyết dày', 80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa', 82: 'Mưa rào mạnh', 85: 'Tuyết rào', 86: 'Tuyết rào dày',
  95: 'Giông', 96: 'Giông có mưa đá', 99: 'Giông có mưa đá mạnh',
};

export interface WeatherData {
  name: string;
  temp: number;
  desc: string;
  windSpeed: number;
  isDay: number;
  relativeHumidity: number;
  weatherCode: number;
}

@Injectable({ providedIn: 'root' })
export class WeatherService {
  constructor(private http: HttpClient) {}

  getWeather(lat: number, lon: number) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=Asia%2FBangkok`;
    return this.http.get<any>(url).pipe(
      map(res => ({
        temp: res?.current?.temperature_2m ?? 0,
        weatherCode: res?.current?.weather_code ?? 0,
        desc: WMO_MAP[res?.current?.weather_code ?? 0] ?? 'Không xác định',
        windSpeed: res?.current?.wind_speed_10m ?? 0,
        isDay: res?.current?.is_day ?? 1,
        relativeHumidity: res?.current?.relative_humidity_2m ?? 0,
      }))
    );
  }

  reverseGeocode(lat: number, lon: number) {
    const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=vi&count=1`;
    return this.http.get<any>(url).pipe(
      map(res => {
        const place = res?.results?.[0];
        if (!place) return 'Vị trí hiện tại';
        return place.name || place.admin2 || place.admin1 || 'Vị trí hiện tại';
      })
    );
  }

  getCurrentPosition() {
    return new Observable<{ lat: number; lon: number }>(observer => {
      if (!navigator.geolocation) {
        observer.error(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          observer.next({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          observer.complete();
        },
        err => observer.error(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  }
}
