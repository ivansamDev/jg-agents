import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface User {
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  readonly currentUser = signal<User | null>(this.getSavedUser());
  readonly isAuthenticated = computed(() => this.currentUser() !== null);

  private getSavedUser(): User | null {
    if (typeof localStorage === 'undefined') return null;
    const saved = localStorage.getItem('jg-auth-user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  }

  login(email: string, password: string): Observable<User> {
    if (!email || !email.includes('@')) {
      return throwError(() => new Error('Invalid email format.')).pipe(delay(400));
    }
    if (!password || password.length < 6) {
      return throwError(() => new Error('Password must be at least 6 characters.')).pipe(delay(400));
    }

    // Default correct mock credentials
    if (email === 'admin@jgroup.tech' && password === 'password123') {
      const user: User = { email, name: 'Administrator' };
      this.currentUser.set(user);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('jg-auth-user', JSON.stringify(user));
      }
      return of(user).pipe(delay(600));
    } else {
      return throwError(() => new Error('Invalid email or password.')).pipe(delay(600));
    }
  }

  logout(): void {
    this.currentUser.set(null);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('jg-auth-user');
    }
  }
}
