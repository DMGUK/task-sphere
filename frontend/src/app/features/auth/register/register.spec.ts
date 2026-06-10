import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Register } from './register';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../core/toast.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let mockAuth: jest.Mocked<Pick<AuthService, 'register'>>;
  let mockToast: jest.Mocked<Pick<ToastService, 'error'>>;
  let router: Router;

  beforeEach(async () => {
    mockAuth = { register: jest.fn() };
    mockToast = { error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('has displayName, email and password fields', () => {
    expect(component.displayName).toBeDefined();
    expect(component.email).toBeDefined();
    expect(component.password).toBeDefined();
  });

  it('calls auth.register with all three fields on submit', () => {
    mockAuth.register.mockReturnValue(of({ token: 'jwt' } as any));
    component.displayName = 'Test User';
    component.email = 'user@test.com';
    component.password = 'pass123';
    component.submit();
    expect(mockAuth.register).toHaveBeenCalledWith('user@test.com', 'pass123', 'Test User');
  });

  it('redirects to /auth/login with registered flag on success', () => {
    mockAuth.register.mockReturnValue(of({ token: 'jwt' } as any));
    component.email = 'user@test.com';
    component.password = 'pass123';
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { registered: 'true' } },
    );
  });

  it('shows toast on registration error with server message', () => {
    const error = { error: { message: 'Email already in use' } };
    mockAuth.register.mockReturnValue(throwError(() => error));
    component.submit();
    expect(mockToast.error).toHaveBeenCalledWith('Email already in use');
  });

  it('shows fallback error when no server message', () => {
    mockAuth.register.mockReturnValue(throwError(() => ({})));
    component.submit();
    expect(mockToast.error).toHaveBeenCalledWith('Registration failed');
  });
});
