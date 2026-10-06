import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthLayout } from './auth-layout';
import { provideTranslateTesting } from '../../../../../testing/translate-testing';
import { ThemeService, THEME_STORAGE_KEY } from '../../../../core/services/theme';

describe('AuthLayout theme toggle', () => {
  let fixture: ComponentFixture<AuthLayout>;

  beforeEach(async () => {
    globalThis.localStorage?.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [AuthLayout],
      providers: [provideRouter([]), provideTranslateTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthLayout);
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('opens the theme menu next to the language switcher', () => {
    const toggle = el().querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]')[0];
    expect(toggle).toBeTruthy();
    toggle.click();
    fixture.detectChanges();

    const radios = el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    expect(radios.length).toBe(3);
    expect(radios[0].getAttribute('aria-checked')).toBe('true'); // light default
  });

  it('switches to dark and reflects it on <html>', () => {
    const toggle = el().querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]')[0];
    toggle.click();
    fixture.detectChanges();

    const radios = el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    radios[1].click(); // Dark
    fixture.detectChanges();

    const service = TestBed.inject(ThemeService);
    expect(service.preference()).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('choosing the system option persists it', () => {
    const toggle = el().querySelectorAll<HTMLButtonElement>('[aria-haspopup="menu"]')[0];
    toggle.click();
    fixture.detectChanges();
    el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]')[2].click();
    fixture.detectChanges();

    expect(globalThis.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system');
  });
});
