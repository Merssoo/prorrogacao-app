import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuController, ToastController } from '@ionic/angular';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ActiveTeamService } from '../../../services/active-team.service';

export const MAIN_MENU_ID = 'main-menu';

type MenuContext = 'hub' | 'home' | null;

@Component({
  standalone: false,
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent implements OnInit, OnDestroy {
  readonly menuId = MAIN_MENU_ID;
  context: MenuContext = null;

  private routerSubscription?: Subscription;

  constructor(
    private readonly router: Router,
    private readonly menuController: MenuController,
    private readonly authService: AuthService,
    private readonly toastController: ToastController,
    private readonly activeTeamService: ActiveTeamService,
  ) {}

  ngOnInit(): void {
    this.updateContext(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.updateContext(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  get isHub(): boolean {
    return this.context === 'hub';
  }

  get isHome(): boolean {
    return this.context === 'home';
  }

  createTeam(): void {
    this.navigateAndClose('/create-team');
  }

  joinTeam(): void {
    this.navigateAndClose('/join-team');
  }

  goToHub(): void {
    this.activeTeamService.clearActiveTeam();
    this.navigateAndClose('/hub');
  }

  async editProfile(): Promise<void> {
    await this.close();
    const toast = await this.toastController.create({
      message: 'Edição de perfil chega em breve.',
      duration: 2500,
      color: 'medium',
      position: 'bottom',
    });
    await toast.present();
  }

  async logout(): Promise<void> {
    await this.close();
    await this.authService.logout();
  }

  private updateContext(url: string): void {
    if (url.startsWith('/hub')) {
      this.context = 'hub';
    } else if (url.startsWith('/home')) {
      this.context = 'home';
    } else {
      this.context = null;
    }
  }

  private async navigateAndClose(url: string): Promise<void> {
    await this.close();
    await this.router.navigateByUrl(url);
  }

  private async close(): Promise<void> {
    await this.menuController.close(this.menuId);
  }
}
