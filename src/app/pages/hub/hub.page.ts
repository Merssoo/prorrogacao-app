import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, ToastController, ViewWillEnter } from '@ionic/angular';
import { ProfileService } from '../../services/profile.service';
import { TeamMembership, TeamsService } from '../../services/teams.service';
import { getErrorMessage } from '../../shared/http-error.util';
import { MAIN_MENU_ID } from '../../shared/components/side-menu/side-menu.component';
import { ActiveTeamService } from '../../services/active-team.service';
import { initialsOf } from '../../shared/initials.util';

@Component({
  standalone: false,
  selector: 'app-hub',
  templateUrl: './hub.page.html',
  styleUrls: ['./hub.page.scss'],
})
export class HubPage implements ViewWillEnter {
  nickname = '';
  memberships: TeamMembership[] = [];
  loading = true;

  constructor(
    private readonly router: Router,
    private readonly profileService: ProfileService,
    private readonly teamsService: TeamsService,
    private readonly toastController: ToastController,
    private readonly menuController: MenuController,
    private readonly activeTeamService: ActiveTeamService,
  ) {}

  openMenu(): void {
    this.menuController.open(MAIN_MENU_ID);
  }

  ionViewWillEnter(): void {
    this.resetState();

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        this.nickname = profile?.nickname ?? '';
      },
      error: () => {},
    });

    this.teamsService.getMyMemberships().subscribe({
      next: (memberships) => {
        this.memberships = memberships;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showToast(getErrorMessage(error, 'Não foi possível carregar seus times agora.'), 'danger');
      },
    });
  }

  private resetState(): void {
    this.nickname = '';
    this.memberships = [];
    this.loading = true;
  }

  get hasTeams(): boolean {
    return this.memberships.length > 0;
  }

  crestOf(membership: TeamMembership): string {
    return initialsOf(membership.teamName);
  }

  openTeam(membership: TeamMembership): void {
    if (membership.status === 'PENDING') {
      this.showToast('Seu pedido para entrar nesse time ainda está pendente de aprovação.', 'medium');
      return;
    }
    if (membership.role) {
      this.activeTeamService.setActiveTeam({
        teamId: membership.teamId,
        teamName: membership.teamName,
        role: membership.role,
      });
    }
    this.router.navigateByUrl('/home');
  }

  createTeam(): void {
    this.router.navigateByUrl('/create-team');
  }

  joinTeam(): void {
    this.router.navigateByUrl('/join-team');
  }

  private async showToast(message: string, color: 'danger' | 'medium'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: color === 'danger' ? 3000 : 2500,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
