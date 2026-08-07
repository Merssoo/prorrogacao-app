import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetButton, ActionSheetController, AlertController, ToastController, ViewWillEnter } from '@ionic/angular';
import { ActiveTeamService } from '../../services/active-team.service';
import { MembershipType, Squad, SquadMember, TeamsService } from '../../services/teams.service';
import { Role } from '../../shared/components/role-badge/role-badge.component';
import { getErrorMessage } from '../../shared/http-error.util';
import { initialsOf } from '../../shared/initials.util';
import { abbreviatePosition } from '../../shared/position-abbreviation.util';
import { PlayerListItem } from '../../shared/components/player-group/player-group.component';

const ROLE_LABELS: Record<Exclude<Role, 'PRESIDENT'>, string> = {
  PLAYER: 'Jogador',
  TREASURER: 'Tesoureiro',
  COUNCIL_MEMBER: 'Conselheiro',
};

function toPlayerListItem(member: SquadMember): PlayerListItem {
  return {
    name: member.nickname,
    pos: abbreviatePosition(member.position),
    initials: initialsOf(member.nickname),
    photoUrl: member.photoUrl,
    userId: member.userId,
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
  selectedMember: SquadMember | null = null;

  private members: SquadMember[] = [];

  constructor(
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly activeTeamService: ActiveTeamService,
    private readonly actionSheetController: ActionSheetController,
    private readonly alertController: AlertController,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.selectedMember = null;
    this.loadSquad();
  }

  get isEmpty(): boolean {
    return this.subscribers.length === 0 && this.casuals.length === 0;
  }

  get isPresident(): boolean {
    return this.activeTeamService.getActiveRole() === 'PRESIDENT';
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  closeMemberModal(): void {
    this.selectedMember = null;
  }

  async onMemberOptions(item: PlayerListItem): Promise<void> {
    const member = this.members.find((m) => m.userId === item.userId);
    if (!member) return;

    const isTargetPresident = member.role === 'PRESIDENT';
    const buttons: ActionSheetButton[] = [
      { text: 'Ver perfil', icon: 'person-outline', handler: () => { this.selectedMember = member; } },
    ];

    if (this.isPresident && !isTargetPresident) {
      buttons.push({ text: 'Trocar mensalista/avulso', icon: 'swap-horizontal-outline', handler: () => this.openTypeSheet(member) });

      if (member.type === 'SUBSCRIBER') {
        buttons.push(
          { text: 'Trocar papel', icon: 'shield-outline', handler: () => this.openRoleSheet(member) },
          { text: 'Tornar presidente', icon: 'ribbon-outline', handler: () => this.confirmTransferPresidency(member) },
        );
      }

      buttons.push({ text: 'Remover do time', icon: 'person-remove-outline', handler: () => this.confirmRemoveMember(member) });
    }

    const actionSheet = await this.actionSheetController.create({
      header: member.nickname,
      buttons: [...buttons, { text: 'Cancelar', icon: 'close-outline', role: 'cancel' }],
    });
    await actionSheet.present();
  }

  private async openTypeSheet(member: SquadMember): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Trocar vínculo',
      buttons: [
        { text: 'Mensalista', icon: 'card-outline', handler: () => this.updateMemberType(member, 'SUBSCRIBER') },
        { text: 'Avulso', icon: 'cash-outline', handler: () => this.updateMemberType(member, 'CASUAL') },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  private async openRoleSheet(member: SquadMember): Promise<void> {
    const actionSheet = await this.actionSheetController.create({
      header: 'Trocar papel',
      buttons: [
        { text: ROLE_LABELS.PLAYER, icon: 'person-outline', handler: () => this.updateMemberRole(member, 'PLAYER') },
        { text: ROLE_LABELS.TREASURER, icon: 'cash-outline', handler: () => this.updateMemberRole(member, 'TREASURER') },
        { text: ROLE_LABELS.COUNCIL_MEMBER, icon: 'shield-outline', handler: () => this.updateMemberRole(member, 'COUNCIL_MEMBER') },
        { text: 'Cancelar', icon: 'close-outline', role: 'cancel' },
      ],
    });
    await actionSheet.present();
  }

  private async confirmTransferPresidency(member: SquadMember): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Transferir presidência',
      message: `${member.nickname} vira presidente e você passa a ser jogador. Tem certeza?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Transferir', handler: () => this.transferPresidency(member) },
      ],
    });
    await alert.present();
  }

  private async confirmRemoveMember(member: SquadMember): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Remover do time',
      message: `Remover ${member.nickname} do time?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Remover', cssClass: 'alert-danger', handler: () => this.removeMember(member) },
      ],
    });
    await alert.present();
  }

  private updateMemberType(member: SquadMember, type: MembershipType): void {
    this.teamsService.updateMemberType(member.userId, type).subscribe({
      next: () => {
        this.showToast('Vínculo atualizado.', 'medium');
        this.loadSquad();
      },
      error: (error) => this.showToast(getErrorMessage(error, 'Não foi possível atualizar o vínculo agora.'), 'danger'),
    });
  }

  private updateMemberRole(member: SquadMember, role: Role): void {
    this.teamsService.updateMemberRole(member.userId, role).subscribe({
      next: () => {
        this.showToast('Papel atualizado.', 'medium');
        this.loadSquad();
      },
      error: (error) => this.showToast(getErrorMessage(error, 'Não foi possível atualizar o papel agora.'), 'danger'),
    });
  }

  private removeMember(member: SquadMember): void {
    this.teamsService.removeMember(member.userId).subscribe({
      next: () => {
        this.showToast('Removido do time.', 'medium');
        this.loadSquad();
      },
      error: (error) => this.showToast(getErrorMessage(error, 'Não foi possível remover esse jogador agora.'), 'danger'),
    });
  }

  private transferPresidency(member: SquadMember): void {
    this.teamsService.transferPresidency(member.userId).subscribe({
      next: () => {
        const activeTeam = this.activeTeamService.getActiveTeam();
        if (activeTeam) {
          this.activeTeamService.setActiveTeam({ ...activeTeam, role: 'PLAYER' });
        }
        this.showToast('Presidência transferida.', 'medium');
        this.loadSquad();
      },
      error: (error) => this.showToast(getErrorMessage(error, 'Não foi possível transferir a presidência agora.'), 'danger'),
    });
  }

  private loadSquad(): void {
    this.loading = true;
    this.teamsService.getSquad().subscribe({
      next: (squad) => this.applySquad(squad),
      error: (error) => {
        this.loading = false;
        this.showToast(getErrorMessage(error, 'Não foi possível carregar o elenco agora.'), 'danger');
      },
    });
  }

  private applySquad(squad: Squad): void {
    this.members = [...squad.subscribers, ...squad.casuals];
    this.subscribers = squad.subscribers.map(toPlayerListItem);
    this.casuals = squad.casuals.map(toPlayerListItem);
    this.loading = false;
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
