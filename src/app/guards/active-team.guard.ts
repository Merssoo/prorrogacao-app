import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ActiveTeamService } from '../services/active-team.service';
import { TeamsService } from '../services/teams.service';

export const activeTeamGuard: CanActivateFn = async () => {
  const activeTeamService = inject(ActiveTeamService);
  const teamsService = inject(TeamsService);
  const router = inject(Router);

  if (activeTeamService.getActiveTeamId() !== null) {
    return true;
  }

  const persistedTeamId = await activeTeamService.getPersistedTeamId();
  if (persistedTeamId !== null) {
    try {
      const memberships = await firstValueFrom(teamsService.getMyMemberships());
      const membership = memberships.find((m) => m.teamId === persistedTeamId && m.status === 'ACTIVE' && m.role);

      if (membership?.role) {
        activeTeamService.setActiveTeam({
          teamId: membership.teamId,
          teamName: membership.teamName,
          role: membership.role,
        });
        return true;
      }

      activeTeamService.clearActiveTeam();
    } catch {
      // Erro de rede: não descarta o teamId persistido, só não dá pra restaurar agora.
    }
  }

  return router.createUrlTree(['/hub']);
};
