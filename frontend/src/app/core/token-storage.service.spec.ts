import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    service = new TokenStorageService();
  });

  it('returns null when nothing stored', () => {
    expect(service.get()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    service.set('my.jwt.token');
    expect(service.get()).toBe('my.jwt.token');
  });

  it('removes the token', () => {
    service.set('my.jwt.token');
    service.remove();
    expect(service.get()).toBeNull();
  });

  it('overwrites an existing token', () => {
    service.set('old-token');
    service.set('new-token');
    expect(service.get()).toBe('new-token');
  });

  it('uses the key ts_token in localStorage', () => {
    service.set('abc');
    expect(localStorage.getItem('ts_token')).toBe('abc');
  });
});
