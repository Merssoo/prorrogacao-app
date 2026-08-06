import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ViewWillEnter } from '@ionic/angular';
import { MAIN_MENU_ID } from '../../shared/components/side-menu/side-menu.component';
import { ActiveTeamService } from '../../services/active-team.service';
import { Role } from '../../shared/components/role-badge/role-badge.component';

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements ViewWillEnter {
  attendanceConfirmed = false;
  teamName = '';
  role: Role | null = null;

  readonly avatars = ['MG', 'TÔ', 'JR', 'PH', 'CA'];

  constructor(
    private readonly router: Router,
    private readonly menuController: MenuController,
    private readonly activeTeamService: ActiveTeamService,
  ) {}

  ionViewWillEnter(): void {
    const activeTeam = this.activeTeamService.getActiveTeam();
    this.teamName = activeTeam?.teamName ?? '';
    this.role = activeTeam?.role ?? null;
  }

  openMenu(): void {
    this.menuController.open(MAIN_MENU_ID);
  }

  onNavItem(label: string): void {
    if (label === 'Times') {
      this.goToHub();
    }
  }

  private goToHub(): void {
    this.activeTeamService.clearActiveTeam();
    this.router.navigateByUrl('/hub');
  }

  goToEvent(): void {
    this.router.navigateByUrl('/event');
  }

  goToCreateEvent(): void {
    this.router.navigateByUrl('/create-event');
  }

  goToRatings(): void {
    this.router.navigateByUrl('/ratings');
  }

  goToVoting(): void {
    this.router.navigateByUrl('/voting');
  }

  goToDraft(): void {
    this.router.navigateByUrl('/draft');
  }

  goToFinance(): void {
    this.router.navigateByUrl('/finance');
  }

  toggleAttendance(event: Event): void {
    event.stopPropagation();
    this.attendanceConfirmed = !this.attendanceConfirmed;
  }
}
