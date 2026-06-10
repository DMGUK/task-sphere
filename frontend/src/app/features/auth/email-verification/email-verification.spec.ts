import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { EmailVerificationComponent } from './email-verification';
import { AuthService } from '../auth.service';

describe('EmailVerificationComponent', () => {
  let component: EmailVerificationComponent;
  let fixture: ComponentFixture<EmailVerificationComponent>;
  let mockAuth: jest.Mocked<Pick<AuthService, 'verifyEmail'>>;
  let router: Router;

  function createComponent(token = 'valid-token') {
    return TestBed.configureTestingModule({
      imports: [EmailVerificationComponent],
      providers: [
        provideRouter([]),
        provideAnimationsAsync('noop'),
        { provide: AuthService, useValue: mockAuth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: { get: () => token } } },
        },
      ],
    }).compileComponents();
  }

  beforeEach(() => {
    mockAuth = { verifyEmail: jest.fn() };
  });

  afterEach(() => TestBed.resetTestingModule());

  it('creates the component', async () => {
    mockAuth.verifyEmail.mockReturnValue(of({ success: true }));
    await createComponent();
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('calls verifyEmail on init with the token from query params', async () => {
    mockAuth.verifyEmail.mockReturnValue(of({ success: true }));
    await createComponent('my-token-123');
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(mockAuth.verifyEmail).toHaveBeenCalledWith('my-token-123');
  });

  it('sets state to success on valid token', async () => {
    mockAuth.verifyEmail.mockReturnValue(of({ success: true }));
    await createComponent();
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('success');
  });

  it('sets state to error when no token in URL', async () => {
    mockAuth.verifyEmail.mockReturnValue(of({}));
    await createComponent('');
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('error');
  });

  it('sets state to error on API failure', async () => {
    mockAuth.verifyEmail.mockReturnValue(throwError(() => ({ error: { message: 'Bad token' } })));
    await createComponent();
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('error');
  });

  it('sets state to already-verified when server reports alreadyVerified', async () => {
    mockAuth.verifyEmail.mockReturnValue(of({ alreadyVerified: true }));
    await createComponent();
    fixture = TestBed.createComponent(EmailVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component.state()).toBe('already-verified');
  });
});
