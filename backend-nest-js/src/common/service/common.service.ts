import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  getRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++)
      color += letters[Math.floor(Math.random() * 16)];

    return color;
  }

  /**
   * Converts value to percent between min and max. For example,
   * procentFromValue(50, { min: 0, max: 100 }) returns 0.5.
   */
  percentFromValue(value: number, limit = { min: 0, max: 100 }): number {
    return (value - limit.min) / (limit.max - limit.min);
  }

  /**
   * Calculates the 1RM (one-rep max) based on the weight and reps.
   * It returns the estimated 1RM.
   */
  calculateRepMax(weight: number, reps: number): number {
    return weight / (1.0278 - 0.0278 * reps);
  }
}