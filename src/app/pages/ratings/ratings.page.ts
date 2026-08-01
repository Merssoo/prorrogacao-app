import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface PlayerRating {
  name: string;
  pos: string;
  initials: string;
}

@Component({
  standalone: false,
  selector: 'app-ratings',
  templateUrl: './ratings.page.html',
  styleUrls: ['./ratings.page.scss'],
})
export class RatingsPage {
  readonly players: PlayerRating[] = [
    { name: 'Marcão', pos: 'GOL', initials: 'MG' },
    { name: 'Tota', pos: 'ZAG', initials: 'TÔ' },
    { name: 'Caco', pos: 'MEI', initials: 'CA' },
    { name: 'Léo', pos: 'ATA', initials: 'LÉ' },
  ];

  ratings: Record<number, number> = { 0: 8, 1: 7, 2: 9, 3: 6 };

  readonly ratingScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  constructor(private readonly router: Router) {}

  setRating(i: number, n: number): void {
    this.ratings[i] = n;
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }
}
