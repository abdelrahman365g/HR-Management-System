import { FormControl } from '@angular/forms';
import { nonNegativeNumberValidator, positiveNumberValidator } from './settings.validators';

describe('positiveNumberValidator', () => {
  const validate = positiveNumberValidator();

  it('accepts a positive integer', () => {
    expect(validate(new FormControl('2'))).toBeNull();
  });

  it('accepts a positive decimal', () => {
    expect(validate(new FormControl('0.5'))).toBeNull();
  });

  it('rejects zero', () => {
    expect(validate(new FormControl('0'))).toEqual({ positiveNumber: true });
  });

  it('rejects negatives', () => {
    expect(validate(new FormControl('-1'))).toEqual({ positiveNumber: true });
  });

  it('rejects scientific notation', () => {
    expect(validate(new FormControl('1e3'))).toEqual({ positiveNumber: true });
  });

  it('rejects letters', () => {
    expect(validate(new FormControl('abc'))).toEqual({ positiveNumber: true });
  });

  it('rejects symbols', () => {
    expect(validate(new FormControl('1,5'))).toEqual({ positiveNumber: true });
  });

  it('ignores empty values (required handles those)', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});

describe('nonNegativeNumberValidator', () => {
  const validate = nonNegativeNumberValidator();

  it('accepts zero', () => {
    expect(validate(new FormControl('0'))).toBeNull();
  });

  it('accepts a positive decimal', () => {
    expect(validate(new FormControl('1.5'))).toBeNull();
  });

  it('rejects negatives', () => {
    expect(validate(new FormControl('-0.5'))).toEqual({ nonNegativeNumber: true });
  });

  it('rejects scientific notation', () => {
    expect(validate(new FormControl('1e3'))).toEqual({ nonNegativeNumber: true });
  });

  it('rejects letters', () => {
    expect(validate(new FormControl('abc'))).toEqual({ nonNegativeNumber: true });
  });

  it('ignores empty values', () => {
    expect(validate(new FormControl(''))).toBeNull();
  });
});
