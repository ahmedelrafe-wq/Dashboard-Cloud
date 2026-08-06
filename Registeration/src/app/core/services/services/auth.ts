import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Auth/session helper.
// - Login/register/etc. hit RegistrationBack (authApi).
// - The connected-providers list hits cloudsBack (cloudApi).
@Injectable({ providedIn: 'root' })
export class Auth {
  private authApi = environment.authApi;
  private cloudApi = environment.cloudApi;

  constructor(private http: HttpClient) {}

  // ---- token helpers (JWT saved by login.ts) ----
  get token(): string | null {
    return localStorage.getItem('token');
  }
  isLoggedIn(): boolean {
    return !!this.token;
  }
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }
  logout(): void {
    localStorage.removeItem('token');
  }

  // ---- RegistrationBack auth endpoints ----
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.authApi}/auth/login`, { email, password });
  }
  register(name: string, email: string, password: string): Observable<any> {
    return this.http.post(`${this.authApi}/auth/sign-up`, { name, email, password });
  }

  // ---- cloudsBack: which providers this user has connected ----
  providers(): Observable<{ providers: any[] }> {
    return this.http.get<{ providers: any[] }>(`${this.cloudApi}/api/providers`);
  }
}
