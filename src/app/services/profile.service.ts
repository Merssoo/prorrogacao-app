import { Injectable } from '@angular/core';
import { HttpBackend, HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { ApiService } from './api.service';

export interface Profile {
  nickname: string;
  position: string;
  secondaryPosition?: string;
  dominantFoot: string;
  photoUrl?: string;
  birthDate?: string;
  preferredJerseyNumber?: number;
  attackRating?: number;
  defenseRating?: number;
  physicalRating?: number;
  skillRating?: number;
}

export interface PhotoUploadUrl {
  uploadUrl: string;
  photoUrl: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly endpoint = '/profile';
  private readonly httpNoInterceptors: HttpClient;

  constructor(
    private readonly apiService: ApiService,
    httpBackend: HttpBackend,
  ) {
    this.httpNoInterceptors = new HttpClient(httpBackend);
  }

  getMyProfile(): Observable<Profile | null> {
    return this.apiService.get<Profile>(this.endpoint).pipe(
      catchError((error: HttpErrorResponse) => (error.status === 404 ? of(null) : throwError(() => error))),
    );
  }

  saveProfile(data: Profile): Observable<Profile> {
    return this.apiService.put<Profile>(this.endpoint, data);
  }

  requestPhotoUploadUrl(data: { fileName: string; fileSize: number; contentType: string }): Observable<PhotoUploadUrl> {
    return this.apiService.post(`${this.endpoint}/photo-upload-url`, data);
  }

  uploadPhotoToStorage(uploadUrl: string, file: Blob, contentType: string): Observable<unknown> {
    return this.httpNoInterceptors.put(uploadUrl, file, { headers: { 'Content-Type': contentType } });
  }
}
