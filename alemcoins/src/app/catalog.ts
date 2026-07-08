import { Component, inject, signal, computed } from '@angular/core';
import { CoinService, Coin } from './coin.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog {
  private readonly coinService = inject(CoinService);

  // Signals
  protected readonly searchTerm = signal<string>('');
  protected readonly sortBy = signal<string>('default');
  protected readonly selectedCoin = signal<Coin | null>(null);
  protected readonly flippedCoins = signal<{ [key: number]: boolean }>({});
  protected readonly selectedCategory = signal<string>('all');
  
  // Modal internal state for flipping inside the details modal
  protected readonly modalFlipped = signal<boolean>(false);

  // Pagination Signals
  protected readonly currentPage = signal<number>(1);
  protected readonly pageSize = signal<number>(12); // 12 coins per page fits perfectly in grid layouts

  // Categories computed signal (unique list of sheets)
  protected readonly categories = computed(() => {
    const allCoins = this.coinService.coins();
    const sheetCategories = Array.from(new Set(allCoins.map(coin => coin.category).filter(Boolean))) as string[];
    return ['all', ...sheetCategories];
  });

  // Total pages computed signal
  protected readonly totalPages = computed(() => {
    return Math.ceil(this.filteredCoins().length / this.pageSize()) || 1;
  });

  // Paginated subset of filtered coins
  protected readonly paginatedCoins = computed(() => {
    const coins = this.filteredCoins();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return coins.slice(start, end);
  });

  // Pages array computed signal
  protected readonly pages = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  // Stats computed signal
  protected readonly stats = computed(() => {
    const allCoins = this.coinService.coins();
    const filtered = this.filteredCoins();
    
    const totalTypes = allCoins.length;
    const totalQuantity = allCoins.reduce((sum, coin) => sum + (coin.quantity || 0), 0);
    const matchedCount = filtered.length;
    const totalMatchedQuantity = filtered.reduce((sum, coin) => sum + (coin.quantity || 0), 0);

    return {
      totalTypes,
      totalQuantity,
      matchedCount,
      totalMatchedQuantity
    };
  });

  // Filtered and Sorted Coins computed signal
  protected readonly filteredCoins = computed(() => {
    const allCoins = this.coinService.coins();
    const query = this.searchTerm().trim().toLowerCase();
    const sort = this.sortBy();
    const cat = this.selectedCategory();

    // 1. Filtering by category & query
    let result = allCoins;
    if (cat !== 'all') {
      result = result.filter(coin => coin.category === cat);
    }
    
    if (query) {
      result = result.filter((coin) => {
        const nameMatch = coin.name.toLowerCase().includes(query);
        const desc1Match = coin.image1_desc ? coin.image1_desc.toLowerCase().includes(query) : false;
        const desc2Match = coin.image2_desc ? coin.image2_desc.toLowerCase().includes(query) : false;
        return nameMatch || desc1Match || desc2Match;
      });
    }

    // 2. Sorting
    result = [...result];
    
    if (sort === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    } else if (sort === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    } else if (sort === 'qty-desc') {
      result.sort((a, b) => {
        const diff = b.quantity - a.quantity;
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ru');
      });
    } else if (sort === 'qty-asc') {
      result.sort((a, b) => {
        const diff = a.quantity - b.quantity;
        return diff !== 0 ? diff : a.name.localeCompare(b.name, 'ru');
      });
    }
    
    return result;
  });

  // Category select handler
  protected selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
  }

  // Category UI Label mapper
  protected getCategoryLabel(category: string): string {
    return category === 'all' ? 'Все монеты' : category;
  }

  // Search input handler
  protected onSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.currentPage.set(1);
  }

  // Clear search input
  protected clearSearch(inputEl: HTMLInputElement): void {
    inputEl.value = '';
    this.searchTerm.set('');
    this.currentPage.set(1);
    inputEl.focus();
  }

  // Sort handler
  protected onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy.set(target.value);
    this.currentPage.set(1);
  }

  // Pagination handlers
  protected setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      const controlsEl = document.querySelector('.controls-section');
      if (controlsEl) {
        controlsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  protected prevPage(): void {
    this.setPage(this.currentPage() - 1);
  }

  protected nextPage(): void {
    this.setPage(this.currentPage() + 1);
  }

  // Fast toggling of card side in catalog grid
  protected toggleFlip(coinId: number, event: Event): void {
    event.stopPropagation(); // Prevent opening modal when clicking flip button
    this.flippedCoins.update((flipped) => ({
      ...flipped,
      [coinId]: !flipped[coinId]
    }));
  }

  // Modal handlers
  protected openDetails(coin: Coin): void {
    this.selectedCoin.set(coin);
    this.modalFlipped.set(false); // Reset to front side when opening modal
  }

  protected closeDetails(): void {
    this.selectedCoin.set(null);
  }

  protected toggleModalFlip(): void {
    this.modalFlipped.update((f) => !f);
  }
}
