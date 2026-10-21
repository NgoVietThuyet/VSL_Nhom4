import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { WeatherScene } from '../../models/weather-scene';

@Component({
  selector: 'app-tk-weather-banner-scene',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './weather-banner-scene.html',
  styleUrl: './weather-banner-scene.scss',
})
export class TkWeatherBannerScene {
  @Input() scene: WeatherScene = 'clear-day';

  readonly rainDrops = Array.from({ length: 48 }, (_, i) => i);
  readonly snowFlakes = Array.from({ length: 36 }, (_, i) => i);
  readonly stars = Array.from({ length: 24 }, (_, i) => i);
  readonly clouds = Array.from({ length: 5 }, (_, i) => i);

  showSun(): boolean {
    return this.scene === 'clear-day' || this.scene === 'partly-cloudy-day';
  }

  showMoon(): boolean {
    return this.scene === 'clear-night' || this.scene === 'partly-cloudy-night';
  }

  showClouds(): boolean {
    return ['partly-cloudy-day', 'partly-cloudy-night', 'cloudy', 'drizzle', 'rain', 'heavy-rain', 'thunderstorm'].includes(this.scene);
  }

  showRain(): boolean {
    return ['drizzle', 'rain', 'heavy-rain', 'thunderstorm'].includes(this.scene);
  }

  showSnow(): boolean {
    return this.scene === 'snow';
  }

  showFog(): boolean {
    return this.scene === 'fog';
  }

  showLightning(): boolean {
    return this.scene === 'thunderstorm';
  }

  rainIntensity(): 'light' | 'medium' | 'heavy' {
    if (this.scene === 'drizzle') return 'light';
    if (this.scene === 'heavy-rain' || this.scene === 'thunderstorm') return 'heavy';
    return 'medium';
  }

  starStyle(i: number): Record<string, string> {
    return {
      top: `${(i * 17) % 55 + 5}%`,
      left: `${(i * 23) % 90 + 5}%`,
      animationDelay: `${(i % 5) * 0.35}s`,
    };
  }

  dropStyle(i: number): Record<string, string> {
    return {
      left: `${(i * 2.1) % 100}%`,
      animationDuration: `${0.55 + (i % 7) * 0.08}s`,
      animationDelay: `${(i % 20) * -0.12}s`,
    };
  }

  flakeStyle(i: number): Record<string, string> {
    return {
      left: `${(i * 2.8) % 100}%`,
      width: `${4 + (i % 4)}px`,
      height: `${4 + (i % 4)}px`,
      animationDuration: `${3 + (i % 10) * 0.35}s`,
      animationDelay: `${(i % 15) * -0.25}s`,
    };
  }
}
