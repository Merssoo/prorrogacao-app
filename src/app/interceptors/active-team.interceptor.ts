import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { ActiveTeamService } from '../services/active-team.service';
import { environment } from '../../environments/environment';

export const ACTIVE_TEAM_HEADER = 'X-Active-Team';

export const activeTeamInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const activeTeamId = inject(ActiveTeamService).getActiveTeamId();
  if (activeTeamId === null) {
    return next(req);
  }

  return next(req.clone({ setHeaders: { [ACTIVE_TEAM_HEADER]: String(activeTeamId) } }));
};
