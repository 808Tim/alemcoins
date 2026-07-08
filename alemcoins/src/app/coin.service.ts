import { Injectable, signal } from '@angular/core';

export interface Coin {
  id: number;
  name: string;
  quantity: number;
  image1: string | null;
  image1_desc: string | null;
  image2: string | null;
  image2_desc: string | null;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoinService {
  private readonly _coins = signal<Coin[]>([]);
  public readonly coins = this._coins.asReadonly();

  constructor() {
    this.loadCoins();
  }

  private loadCoins(): void {
    fetch('coins.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data: Coin[]) => {
        this._coins.set(data);
      })
      .catch((err) => {
        console.error('Failed to load coins.json database:', err);
      });
  }
}
