import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Login } from './login';
import { AuthService } from '../auth.service';
import { ToastService } from '../../../core/toast.service';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let mockAuth: jest.Mocked<Pick<AuthService, 'login' | 'isLoggedIn'>>;
  let mockToast: jest.Mocked<Pick<ToastService, 'error'>>;
  let router: Router;

  beforeEach(async () => {
    mockAuth = { login: jest.fn(), isLoggedIn: jest.fn().mockReturnValue(false) };
    mockToast = { error: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: AuthService, useValue: mockAuth },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    jest.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('redirects to /tasks immediately if already logged in', () => {
    mockAuth.isLoggedIn.mockReturnValue(true);
    component.ngOnInit();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('does not redirect when not logged in', () => {
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('calls auth.login with email and password on submit', () => {
    mockAuth.login.mockReturnValue(of({ token: 'jwt' }));
    component.email = 'user@test.com';
    component.password = 'pass123';
    component.submit();
    expect(mockAuth.login).toHaveBeenCalledWith('user@test.com', 'pass123');
  });

  it('navigates to /tasks on successful login', () => {
    mockAuth.login.mockReturnValue(of({ token: 'jwt' }));
    component.email = 'user@test.com';
    component.password = 'pass123';
    component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/tasks']);
  });

  it('shows toast on login error with server message', () => {
    const error = { error: { message: 'Invalid credentials' } };
    mockAuth.login.mockReturnValue(throwError(() => error));
    component.submit();
    expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials');
  });

  it('shows fallback toast when no server message', () => {
    mockAuth.login.mockReturnValue(throwError(() => ({})));
    component.submit();
    expect(mockToast.error).toHaveBeenCalledWith('Invalid credentials');
  });
});
