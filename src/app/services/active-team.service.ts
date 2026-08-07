import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Role } from '../shared/components/role-badge/role-badge.component';
import { SecureStorageService } from './secure-storage.service';

export interface ActiveTeam {
  teamId: number;
  teamName: string;
  role: Role;
}

@Injectable({ providedIn: 'root' })
export class ActiveTeamService {
  private readonly activeTeamSubject = new BehaviorSubject<ActiveTeam | null>(null);
  readonly activeTeam$ = this.activeTeamSubject.asObservable();

  constructor(private readonly storage: SecureStorageService) {}

  setActiveTeam(activeTeam: ActiveTeam): void {
    this.activeTeamSubject.next(activeTeam);
    void this.storage.setActiveTeamId(String(activeTeam.teamId));
  }

  clearActiveTeam(): void {
    this.activeTeamSubject.next(null);
    void this.storage.removeActiveTeamId();
  }

  async getPersistedTeamId(): Promise<number | null> {
    const stored = await this.storage.getActiveTeamId();
    if (!stored) return null;
    const teamId = Number(stored);
    return Number.isFinite(teamId) ? teamId : null;
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
