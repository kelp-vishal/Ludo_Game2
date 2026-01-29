import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  IUser,
  ILoginResponse,
  IRegisterResponse,
} from '@ludo-game/shared-lib';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Injected services
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Properties
  User: IUser[] = [];
  LoginResponse: ILoginResponse[] = [];
  RegisterResponse: IRegisterResponse[] = [];

  private apiUrl = "/api/auth";
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Load user from localStorage if running in browser
    if (this.isBrowser) {
      const user = localStorage.getItem('currentUser');
      if (user) {
        this.currentUserSubject.next(JSON.parse(user));
      }
    }
  }

  login(username: string, password: string): Observable<ILoginResponse> {
    return this.http
      .post<ILoginResponse>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap((response) => {
          if (this.isBrowser) {
            localStorage.setItem('access_token', response.access_token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
          }
          this.currentUserSubject.next(response.user);
        }),
      );
  }

  register(
    username: string,
    email: string,
    password: string,
  ): Observable<IRegisterResponse> {
    return this.http.post<IRegisterResponse>(`${this.apiUrl}/register`, {
      username,
      email,
      password,
    });
  }

  logout(): void {
    if (this.isBrowser) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    if (!this.isBrowser) {
      return false;
    }
    return !!localStorage.getItem('access_token');
  }
}
