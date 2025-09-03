import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class BuscadorService {

  searchQuery: string = '';
  searchResults: any[] = [];


  private searchQuerySource = new BehaviorSubject<string>('');
  searchQuery$ = this.searchQuerySource.asObservable();

  private filteredResultsSource = new BehaviorSubject<any[]>([]);
  filteredResults$ = this.filteredResultsSource.asObservable();

  setSearchQuery(query: string) {
    this.searchQuerySource.next(query);
  }

  setFilteredResults(results: any[]) {
    this.filteredResultsSource.next(results);
  }
}


