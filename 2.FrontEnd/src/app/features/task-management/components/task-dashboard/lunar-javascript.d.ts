declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar;
    getDay(): number;
    getMonth(): number;
    getYear(): number;
  }
}
