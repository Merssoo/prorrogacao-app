import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-voting',
  templateUrl: './voting.page.html',
  styleUrls: ['./voting.page.scss'],
})
export class VotingPage {
  readonly opts1 = ['Marcão', 'Caco', 'Léo', 'Júnior'];
  readonly opts2 = ['Bill', 'Nando', 'Kadu', 'Rafa'];
  readonly opts3 = ['Ótimo', 'Bom', 'Regular', 'Ruim'];

  q1 = 'Caco';
  q2 = 'Bill';
  q3 = 'Bom';

  constructor(private readonly router: Router) {}

  goBack(): void {
    this.router.navigateByUrl('/home');
  }
}
