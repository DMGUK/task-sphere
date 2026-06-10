import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { TokenStorageService } from '../../core/token-storage.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let tokenStorage: TokenStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        AuthService,
        TokenStorageService,
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(TokenStorageService);
    tokenStorage.remove();
  });

  afterEach(() => {
    http.verify();
  });

  // ─── Token storage ────────────────────────────────────────────────────

  describe('token', () => {
    it('is null when not logged in', () => {
      expect(service.token).toBeNull();
    });

    it('stores and returns a token', () => {
      service.token = 'abc.def.ghi';
      expect(service.token).toBe('abc.def.ghi');
    });

    it('clears token when set to null', () => {
      service.token = 'abc';
      service.token = null;
      expect(service.token).toBeNull();
    });
  });

  // ─── isLoggedIn ───────────────────────────────────────────────────────

  describe('isLoggedIn()', () => {
    it('returns false when no token', () => {
      expect(service.isLoggedIn()).toBe(false);
    });

    it('returns true when token is present', () => {
      service.token = 'valid.jwt.token';
      expect(service.isLoggedIn()).toBe(true);
    });
  });

  // ─── login ────────────────────────────────────────────────────────────

  describe('login()', () => {
    it('POSTs to /auth/login and stores token', () => {
      service.login('user@test.com', 'pass123').subscribe();

      const req = http.expectOne(r => r.url.includes('/auth/login'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@test.com', password: 'pass123' });

      req.flush({ token: 'returned.jwt.token', user: { id: 1 } });
      expect(service.token).toBe('returned.jwt.token');
    });

    it('propagates HTTP errors', (done) => {
      service.login('bad@test.com', 'wrong').subscribe({
        error: (err) => {
          expect(err.status).toBe(401);
          done();
        },
      });

      http.expectOne(r => r.url.includes('/auth/login'))
        .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });
    });
  });

  // ─── register ─────────────────────────────────────────────────────────

  describe('register()', () => {
    it('POSTs to /auth/register with all fields', () => {
      service.register('user@test.com', 'pass123', 'Test User').subscribe();

      const req = http.expectOne(r => r.url.includes('/auth/register'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toBe('user@test.com');
      expect(req.request.body.displayName).toBe('Test User');

      req.flush({ message: 'Registered' });
    });

    it('omits displayName when not provided', () => {
      service.register('user@test.com', 'pass123').subscribe();

      const req = http.expectOne(r => r.url.includes('/auth/register'));
      expect(req.request.body.displayName).toBeUndefined();
      req.flush({ message: 'Registered' });
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('clears the token', () => {
      service.token = 'some.jwt';
      service.logout();
      expect(service.token).toBeNull();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  // ─── forgotPassword ───────────────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('POSTs to /auth/forgot-password', () => {
      service.forgotPassword('user@test.com').subscribe();

      const req = http.expectOne(r => r.url.includes('/auth/forgot-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'user@test.com' });
      req.flush({ message: 'Sent' });
    });
  });

  // ─── resetPassword ────────────────────────────────────────────────────

  describe('resetPassword()', () => {
    it('POSTs token and new password', () => {
      service.resetPassword('reset-token-123', 'newpass456').subscribe();

      const req = http.expectOne(r => r.url.includes('/auth/reset-password'));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'reset-token-123', password: 'newpass456' });
      req.flush({ message: 'Reset' });
    });
  });
});
