import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MainLayout } from './main-layout';
import { AuthService } from '../../features/auth/auth.service';
import { ProfileService } from '../../features/profile/profile.service';
import { ToastService } from '../../core/toast.service';
import { LoadingService } from '../../core/loading.service';

describe('MainLayout', () => {
  let component: MainLayout;
  let fixture: ComponentFixture<MainLayout>;
  let mockAuth: jest.Mocked<Pick<AuthService, 'isLoggedIn' | 'logout' | 'resendVerification'>>;
  let mockProfile: jest.Mocked<Pick<ProfileService, 'getMe'>>;
  let mockToast: jest.Mocked<Pick<ToastService, 'success' | 'error'>>;
  let router: Router;

  beforeEach(async () => {
    mockAuth = {
      isLoggedIn: jest.fn().mockReturnValue(false),
      logout: jest.fn(),
      resendVerification: jest.fn().mockReturnValue(of({ success: true })),
    };
    mockProfile = { getMe: jest.fn().mockReturnValue(of(null)) };
    mockToast = { success: jest.fn(), error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: AuthService, useValue: mockAuth },
        { provide: ProfileService, useValue: mockProfile },
        { provide: ToastService, useValue: mockToast },
        LoadingService,
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(MainLayout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('isLoggedIn() delegates to AuthService', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    expect(component.isLoggedIn()).toBe(true);
    mockAuth.isLoggedIn.mockReturnValue(false);
    expect(component.isLoggedIn()).toBe(false);
  });

  it('userDisplayName falls back to email prefix when no displayName', () => {
    (component as any).user = { email: 'dmytro@test.com', displayName: null };
    expect(component.userDisplayName).toBe('dmytro');
  });

  it('userDisplayName uses displayName when set', () => {
    (component as any).user = { email: 'x@test.com', displayName: 'Dmytro' };
    expect(component.userDisplayName).toBe('Dmytro');
  });

  it('userInitials returns U when no user', () => {
    (component as any).user = null;
    expect(component.userInitials).toBe('U');
  });

  it('userInitials derives from displayName', () => {
    (component as any).user = { displayName: 'John Doe', email: 'j@test.com' };
    expect(component.userInitials).toBe('JD');
  });

  it('logout() calls auth.logout and navigates to login', () => {
    component.logout();
    expect(mockAuth.logout).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('does not load user profile when not logged in on init', () => {
    mockAuth.isLoggedIn.mockReturnValue(false);
    component.ngOnInit();
    expect(mockProfile.getMe).not.toHaveBeenCalled();
  });

  it('loads user profile when logged in on init', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    mockProfile.getMe.mockReturnValue(of({ id: 1, email: 'u@test.com', displayName: 'U', avatarUrl: null, createdAt: '', emailVerifiedAt: null }));
    component.ngOnInit();
    expect(mockProfile.getMe).toHaveBeenCalled();
  });
});
