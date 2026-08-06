import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Talks to cloudsBack for the Google Drive provider.
// The JWT is attached automatically by the auth interceptor.
@Injectable({ providedIn: 'root' })
export class Google {
  private base = `${environment.cloudApi}/api/google`;

  constructor(private http: HttpClient) {}

  // Ask the backend for the Google consent URL (to open in a popup).
  authStart(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.base}/auth/start`);
  }

  logout(): Observable<any> {
    return this.http.post(`${this.base}/logout`, {});
  }

  listFiles(type = '', order: 'asc' | 'desc' = 'desc'): Observable<any> {
    const params: any = { order };
    if (type) params.type = type;
    return this.http.get(`${this.base}/files`, { params });
  }

  viewFileUrl(id: string): string {
    return `${this.base}/files/${id}/view`;
  }

  uploadFile(file: File): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post(`${this.base}/files`, form);
  }

  renameFile(id: string, name: string): Observable<any> {
    return this.http.patch(`${this.base}/files/${id}`, { name });
  }

  deleteFile(id: string): Observable<any> {
    return this.http.delete(`${this.base}/files/${id}`);
  }
}
