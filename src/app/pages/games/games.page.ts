import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActiveTeamService } from '../../services/active-team.service';

@Component({
  standalone: false,
  selector: 'app-games',
  templateUrl: './games.page.html',
  styleUrls: ['./games.page.scss'],
})
export class GamesPage {
  constructor(
    private readonly router: Router,
    private readonly activeTeamService: ActiveTeamService,
  ) {}

  get isPresident(): boolean {
    return this.activeTeamService.getActiveRole() === 'PRESIDENT';
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  onNavItem(label: string): void {
    if (label === 'Times') {
      this.goToHub();
    } else if (label === 'Elenco') {
      this.router.navigateByUrl('/squad');
    }
  }

  private goToHub(): void {
    this.activeTeamService.clearActiveTeam();
    this.router.navigateByUrl('/hub');
  }

  goToCreateEvent(): void {
    this.router.navigateByUrl('/create-event', { state: { from: '/games' } });
  }
}
