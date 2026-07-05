import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should sign in with correct credentials', fakeAsync(() => {
    let successUser: any = null;
    service.login('admin@jgroup.tech', 'password123').subscribe(u => {
      successUser = u;
    });

    tick(600);
    expect(successUser).toBeTruthy();
    expect(successUser.email).toBe('admin@jgroup.tech');
    expect(service.currentUser()).toEqual(successUser);
    expect(service.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem('jg-auth-user')).toContain('admin@jgroup.tech');
  }));

  it('should fail sign in with incorrect credentials', fakeAsync(() => {
    let errorMsg = '';
    service.login('wrong@jgroup.tech', 'password123').subscribe({
      error: (err) => {
        errorMsg = err.message;
      }
    });

    tick(600);
    expect(errorMsg).toBe('Invalid email or password.');
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  }));

  it('should fail with invalid email format', fakeAsync(() => {
    let errorMsg = '';
    service.login('invalidemail', 'password123').subscribe({
      error: (err) => {
        errorMsg = err.message;
      }
    });

    tick(400);
    expect(errorMsg).toBe('Invalid email format.');
  }));

  it('should fail with short password', fakeAsync(() => {
    let errorMsg = '';
    service.login('admin@jgroup.tech', '123').subscribe({
      error: (err) => {
        errorMsg = err.message;
      }
    });

    tick(400);
    expect(errorMsg).toBe('Password must be at least 6 characters.');
  }));

  it('should log out', fakeAsync(() => {
    service.login('admin@jgroup.tech', 'password123').subscribe();
    tick(600);
    expect(service.isAuthenticated()).toBeTrue();

    service.logout();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(localStorage.getItem('jg-auth-user')).toBeNull();
  }));
});
