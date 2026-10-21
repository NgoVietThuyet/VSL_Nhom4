import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { animate, group, query, style, transition, trigger } from '@angular/animations';
import { interval, Subscription } from 'rxjs';
import { WeatherService, WeatherData } from '../../services/weather.service';

export interface WeatherLocation {
  name: string;
  lat: number;
  lon: number;
}

@Component({
  selector: 'app-tk-weather-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-widget.html',
  styleUrl: './weather-widget.scss',
  animations: [
    trigger('rollingWeather', [
      transition(':increment, :decrement', [
        group([
          query(':leave', [
            animate('600ms ease-in', style({ transform: 'translateY(-100%)', opacity: 0 }))
          ], { optional: true }),
          query(':enter', [
            style({ transform: 'translateY(100%)', opacity: 0 }),
            animate('600ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
          ], { optional: true })
        ])
      ])
    ])
  ]
})
export class TkWeatherWidget implements OnChanges, OnDestroy {
  @Input({ required: true }) location!: WeatherLocation;
  /** Dữ liệu đã fetch ở dashboard — tránh gọi Open-Meteo hai lần */
  @Input() prefetchedWeather: (WeatherData & { name: string }) | null = null;

  weatherData: (WeatherData & { name: string }) | null = null;
  currentTime: Date = new Date();
  loading = true;
  private clockSub?: Subscription;

  constructor(private weatherService: WeatherService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['prefetchedWeather'] && this.prefetchedWeather) {
      this.weatherData = this.prefetchedWeather;
      this.loading = false;
      this.startClock();
      return;
    }
    if (changes['location'] && this.location) {
      this.fetchData();
    }
  }

  private startClock(): void {
    this.clockSub?.unsubscribe();
    this.clockSub = interval(1000).subscribe(() => this.currentTime = new Date());
  }

  fetchData(): void {
    if (!this.location) return;
    if (this.prefetchedWeather) {
      this.weatherData = this.prefetchedWeather;
      this.loading = false;
      this.startClock();
      return;
    }
    this.loading = true;
    this.weatherService.getWeather(this.location.lat, this.location.lon).subscribe({
      next: (data) => {
        this.weatherData = { ...data, name: this.location.name };
        this.loading = false;
        this.startClock();
      },
      error: () => {
        this.weatherData = {
          name: this.location.name,
          temp: 0,
          desc: 'N/A',
          windSpeed: 0,
          isDay: 1,
          relativeHumidity: 0,
          weatherCode: 0,
        };
        this.loading = false;
        this.startClock();
      },
    });
  }

  getPeriodIcon(desc: string): string {
    if (!desc) return 'bi-cloud';
    const weather = desc.toLowerCase();
    if (weather.includes('giông')) return 'bi-cloud-lightning-rain-fill text-warning';
    if (weather.includes('mưa')) return 'bi-cloud-rain-heavy-fill text-info';
    const hour = new Date().getHours();
    return (hour >= 6 && hour < 18) ? 'bi-sun-fill text-warning' : 'bi-moon-stars-fill text-primary';
  }

  getWeatherIcon(desc: string): string {
    if (!desc) return 'bi-cloud';
    if (desc.includes('quang') || desc.includes('Quang')) return 'bi-brightness-high';
    if (desc.includes('mây') || desc.includes('Mây')) return 'bi-cloud-sun';
    if (desc.includes('mưa') || desc.includes('Mưa')) return 'bi-cloud-rain';
    if (desc.includes('giông') || desc.includes('Giông')) return 'bi-cloud-lightning-rain';
    return 'bi-cloud';
  }

  isRain(desc: string): boolean {
    const w = desc?.toLowerCase() ?? '';
    return w.includes('giông') || w.includes('mưa');
  }

  ngOnDestroy(): void {
    this.clockSub?.unsubscribe();
  }
}
