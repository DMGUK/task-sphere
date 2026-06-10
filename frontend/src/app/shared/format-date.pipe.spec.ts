import { FormatDatePipe } from './format-date.pipe';

describe('FormatDatePipe', () => {
  let pipe: FormatDatePipe;

  beforeEach(() => {
    pipe = new FormatDatePipe();
  });

  it('formats a valid ISO date string', () => {
    const result = pipe.transform('2026-06-09T00:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2026/);
  });

  it('returns empty string for null', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(pipe.transform(undefined)).toBe('');
  });

  it('includes the day number', () => {
    const result = pipe.transform('2026-01-15T12:00:00.000Z');
    expect(result).toMatch(/15/);
  });
});
