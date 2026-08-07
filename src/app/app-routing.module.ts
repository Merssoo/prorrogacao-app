import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { activeTeamGuard } from './guards/active-team.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: 'verify-email',
    loadChildren: () => import('./pages/verify-email/verify-email.module').then( m => m.VerifyEmailPageModule)
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./pages/forgot-password/forgot-password.module').then( m => m.ForgotPasswordPageModule)
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'hub',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/hub/hub.module').then( m => m.HubPageModule)
  },
  {
    path: 'create-team',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/create-team/create-team.module').then( m => m.CreateTeamPageModule)
  },
  {
    path: 'join-team',
    canActivate: [authGuard],
    loadChildren: () => import('./pages/join-team/join-team.module').then( m => m.JoinTeamPageModule)
  },
  {
    path: 'home',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'squad',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/squad/squad.module').then( m => m.SquadPageModule)
  },
  {
    path: 'games',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/games/games.module').then( m => m.GamesPageModule)
  },
  {
    path: 'membership-requests',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/membership-requests/membership-requests.module').then( m => m.MembershipRequestsPageModule)
  },
  {
    path: 'create-event',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/create-event/create-event.module').then( m => m.CreateEventPageModule)
  },
  {
    path: 'event',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/event/event.module').then( m => m.EventPageModule)
  },
  {
    path: 'draft',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/draft/draft.module').then( m => m.DraftPageModule)
  },
  {
    path: 'ratings',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/ratings/ratings.module').then( m => m.RatingsPageModule)
  },
  {
    path: 'voting',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/voting/voting.module').then( m => m.VotingPageModule)
  },
  {
    path: 'finance',
    canActivate: [authGuard, activeTeamGuard],
    loadChildren: () => import('./pages/finance/finance.module').then( m => m.FinancePageModule)
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
