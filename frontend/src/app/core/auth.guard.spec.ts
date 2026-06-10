import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../features/auth/auth.service';

describe('authGuard', () => {
  let mockAuthService: jest.Mocked<Pick<AuthService, 'isLoggedIn'>>;
  let mockRouter: jest.Mocked<Pick<Router, 'navigate'>>;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/tasks' } as RouterStateSnapshot;

  beforeEach(() => {
    mockAuthService = { isLoggedIn: jest.fn() };
    mockRouter = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    });
  });

  it('returns true when user is logged in', () => {
    mockAuthService.isLoggedIn.mockReturnValue(true);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(true);
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('returns false and redirects when not logged in', () => {
    mockAuthService.isLoggedIn.mockReturnValue(false);
    const result = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(result).toBe(false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/auth/login']);
  });
});
