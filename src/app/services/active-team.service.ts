import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Role } from '../shared/components/role-badge/role-badge.component';

export interface ActiveTeam {
  teamId: number;
  teamName: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class ActiveTeamService {
  private readonly activeTeamSubject = new BehaviorSubject<ActiveTeam | null>(null);
  readonly activeTeam$ = this.activeTeamSubject.asObservable();

  setActiveTeam(activeTeam: ActiveTeam): void {
    this.activeTeamSubject.next(activeTeam);
  }

  clearActiveTeam(): void {
    this.activeTeamSubject.next(null);
  }

  getActiveTeam(): ActiveTeam | null {
    return this.activeTeamSubject.value;
  }

  getActiveTeamId(): number | null {
    return this.activeTeamSubject.value?.teamId ?? null;
  }

  getActiveRole(): Role | null {
    return this.activeTeamSubject.value?.role ?? null;
  }
}
