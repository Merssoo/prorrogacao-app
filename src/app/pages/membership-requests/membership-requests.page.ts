import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { MembershipRequest, MembershipType, TeamsService } from '../../services/teams.service';
import { getErrorMessage } from '../../shared/http-error.util';
import { initialsOf } from '../../shared/initials.util';
import { abbreviatePosition } from '../../shared/position-abbreviation.util';

@Component({
  standalone: false,
  selector: 'app-membership-requests',
  templateUrl: './membership-requests.page.html',
  styleUrls: ['./membership-requests.page.scss'],
})
export class MembershipRequestsPage implements ViewWillEnter {
  requests: MembershipRequest[] = [];
  loading = true;
  approvingId: number | null = null;
  selectedRequest: MembershipRequest | null = null;

  constructor(
    private readonly router: Router,
    private readonly teamsService: TeamsService,
    private readonly toastController: ToastController,
  ) {}

  ionViewWillEnter(): void {
    this.selectedRequest = null;
    this.resetState();
    this.teamsService.getMembershipRequests().subscribe({
      next: (requests) => {
        this.requests = requests;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showToast(getErrorMessage(error, 'Não foi possível carregar os pedidos agora.'), 'danger');
        this.goBack();
      },
    });
  }

  initialsOf(name: string): string {
    return initialsOf(name);
  }

  posOf(position: string | undefined): string {
    return abbreviatePosition(position);
  }

  viewProfile(request: MembershipRequest): void {
    this.selectedRequest = request;
  }

  closeProfileModal(): void {
    this.selectedRequest = null;
  }

  approve(request: MembershipRequest, type: MembershipType): void {
    if (this.approvingId !== null) return;

    this.approvingId = request.membershipId;
    this.teamsService.approveMembershipRequest(request.membershipId, type).subscribe({
      next: () => {
        this.approvingId = null;
        this.requests = this.requests.filter((r) => r.membershipId !== request.membershipId);
        this.showToast('Pedido aprovado.', 'medium');
      },
      error: (error) => {
        this.approvingId = null;
        this.showToast(getErrorMessage(error, 'Não foi possível aprovar esse pedido agora.'), 'danger');
      },
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  private resetState(): void {
    this.requests = [];
    this.loading = true;
    this.approvingId = null;
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
