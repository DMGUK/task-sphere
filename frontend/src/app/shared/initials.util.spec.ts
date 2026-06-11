import { getInitials } from './initials.util';

describe('getInitials', () => {
  it('returns first two letters of a single word', () => {
    expect(getInitials('Alice')).toBe('AL');
  });

  it('returns first letters of two words', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('is case-insensitive input but output is uppercase', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('falls back to email when name is empty', () => {
    expect(getInitials('', 'dm@test.com')).toBe('DM');
  });

  it('falls back to email when name is null', () => {
    expect(getInitials(null, 'xy@test.com')).toBe('XY');
  });

  it('handles multiple spaces between words', () => {
    expect(getInitials('Jane   Smith')).toBe('JS');
  });

  it('returns U when both name and email are empty', () => {
    expect(getInitials('', '')).toBe('U');
  });

  it('handles three-word name using first two', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MJ');
  });
});
