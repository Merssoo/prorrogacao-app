import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { Squad, SquadMember, TeamsService } from '../../services/teams.service';
import { getErrorMessage } from '../../shared/http-error.util';
import { initialsOf } from '../../shared/initials.util';
import { abbreviatePosition } from '../../shared/position-abbreviation.util';
import { PlayerListItem } from '../../shared/components/player-group/player-group.component';

function toPlayerListItem(member: SquadMember): PlayerListItem {
  return {
    name: member.nickname,
    pos: abbreviatePosition(member.position),
    initials: initialsOf(member.nickname),
  };
}

@Component({
  standalone: false,
  selector: 'app-squad',
  templateUrl: './squad.page.html',
  styleUrls: ['./squad.page.scss'],
})
export class SquadPage implements ViewWillEnter {
  subscribers: PlayerListItem[] = [];
  casuals: PlayerListItem[] = [];
  loading = true;

  constructor(
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.resetState();
    this.teamsService.getSquad().subscribe({
      next: (squad) => this.applySquad(squad),
      error: (error) => {
        this.loading = false;
        this.showToast(getErrorMessage(error, 'Não foi possível carregar o elenco agora.'), 'danger');
      },
    });
  }

  get isEmpty(): boolean {
    return this.subscribers.length === 0 && this.casuals.length === 0;
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  private applySquad(squad: Squad): void {
    this.subscribers = squad.subscribers.map(toPlayerListItem);
    this.casuals = squad.casuals.map(toPlayerListItem);
    this.loading = false;
  }

  private resetState(): void {
    this.subscribers = [];
    this.casuals = [];
    this.loading = true;
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
