import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Role } from '../shared/components/role-badge/role-badge.component';
import { CrestShape } from '../shared/components/team-crest-picker/team-crest-picker.component';

export type MembershipStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE';
export type MembershipType = 'SUBSCRIBER' | 'CASUAL';

export interface TeamMembership {
  teamId: number;
  teamName: string;
  crestUrl?: string;
  crestShape?: CrestShape;
  foundationDate?: string;
  city?: string;
  description?: string;
  homeField?: string;
  status: MembershipStatus;
  type?: MembershipType;
  role?: Role;
}

export interface CreateTeamRequest {
  name: string;
  crestUrl?: string;
  crestShape?: CrestShape;
  foundationDate?: string;
  city?: string;
  description?: string;
  homeField?: string;
}

export interface PhotoUploadUrl {
  uploadUrl: string;
  photoUrl: string;
}

export interface TeamSearchResult {
  teamId: number;
  teamName: string;
  crestUrl?: string;
  crestShape?: CrestShape;
  city?: string;
  homeField?: string;
  memberCount: number;
  myMembershipStatus?: MembershipStatus;
}

export interface TeamSearchPage {
  content: TeamSearchResult[];
  page: number;
  size: number;
  totalElements: number;
  hasNext: boolean;
}

export interface SquadMember {
  userId: number;
  nickname: string;
  photoUrl?: string;
  position?: string;
  secondaryPosition?: string;
  jerseyNumber?: number;
  role: Role;
  type?: MembershipType;
}

export interface Squad {
  subscribers: SquadMember[];
  casuals: SquadMember[];
}

@Injectable({ providedIn: 'root' })
export class TeamsService {
  private readonly endpoint = '/teams';
  private readonly httpNoInterceptors: HttpClient;

  constructor(
    private readonly apiService: ApiService,
    httpBackend: HttpBackend,
  ) {
    this.httpNoInterceptors = new HttpClient(httpBackend);
  }

  getMyMemberships(): Observable<TeamMembership[]> {
    return this.apiService.get<TeamMembership[]>(`${this.endpoint}/my-memberships`);
  }

  createTeam(data: CreateTeamRequest): Observable<TeamMembership> {
    return this.apiService.post<TeamMembership>(this.endpoint, data);
  }

  requestPhotoUploadUrl(data: { fileName: string; fileSize: number; contentType: string }): Observable<PhotoUploadUrl> {
    return this.apiService.post(`${this.endpoint}/photo-upload-url`, data);
  }

  uploadPhotoToStorage(uploadUrl: string, file: Blob, contentType: string): Observable<unknown> {
    return this.httpNoInterceptors.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
  }

  searchTeams(query: string, page: number, size: number): Observable<TeamSearchPage> {
    const params = new HttpParams().set('query', query).set('page', page).set('size', size);
    return this.apiService.get<TeamSearchPage>(`${this.endpoint}/search`, { params });
  }

  requestToJoinTeam(teamId: number): Observable<TeamMembership> {
    return this.apiService.post<TeamMembership>(`${this.endpoint}/${teamId}/membership-requests`, {});
  }

  getSquad(): Observable<Squad> {
    return this.apiService.get<Squad>(`${this.endpoint}/squad`);
  }
}
