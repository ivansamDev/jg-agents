import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('AuthGuards', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      isAuthenticated: () => false
    });
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('authGuard', () => {
    it('should allow access if authenticated', () => {
      Object.defineProperty(authService, 'isAuthenticated', { value: () => true });
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should deny access and redirect to /login if unauthenticated', () => {
      Object.defineProperty(authService, 'isAuthenticated', { value: () => false });
      const result = TestBed.runInInjectionContext(() => authGuard({} as any, {} as any));
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('guestGuard', () => {
    it('should deny access and redirect to / if authenticated', () => {
      Object.defineProperty(authService, 'isAuthenticated', { value: () => true });
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBeFalse();
      expect(router.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should allow access if unauthenticated', () => {
      Object.defineProperty(authService, 'isAuthenticated', { value: () => false });
      const result = TestBed.runInInjectionContext(() => guestGuard({} as any, {} as any));
      expect(result).toBeTrue();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });
});
