import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { UserMenu } from './user-menu';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language';
import { ThemeService, THEME_STORAGE_KEY } from '../../../core/services/theme';
import { provideTranslateTesting } from '../../../../testing/translate-testing';

describe('UserMenu', () => {
  let fixture: ComponentFixture<UserMenu>;
  let component: UserMenu;
  let logoutFn: ReturnType<typeof vi.fn>;

  const baseUser = {
    id: '1',
    full_name: 'Ada Lovelace',
    username: 'ada',
    email: 'ada@x.io',
    permission_group_id: 'g1',
    is_hr_admin: false,
    is_active: true,
  };

  beforeEach(async () => {
    logoutFn = vi.fn().mockResolvedValue(undefined);
    globalThis.localStorage?.removeItem(THEME_STORAGE_KEY);
    document.documentElement.classList.remove('dark');

    await TestBed.configureTestingModule({
      imports: [UserMenu],
      providers: [
        provideRouter([]),
        provideTranslateTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => baseUser,
            currentGroup: () => ({ id: 'g1', name: 'HR Officers', permissions: {} }),
            isHrAdmin: () => false,
            hasPermission: () => true,
            logout: logoutFn,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('shows initials and name', () => {
    expect(el().textContent).toContain('AL');
    expect(el().textContent).toContain('Ada Lovelace');
  });

  it('opens and closes the menu', () => {
    const trigger = el().querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    trigger.click();
    fixture.detectChanges();
    expect(el().querySelector('[role="menu"]')).toBeTruthy();

    component.close();
    fixture.detectChanges();
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('switches language from the submenu', () => {
    component.toggle();
    fixture.detectChanges();
    component.toggleLanguages();
    fixture.detectChanges();

    const setLanguage = vi.spyOn(TestBed.inject(LanguageService), 'setLanguage');
    component.chooseLanguage({ code: 'ar', label: 'العربية', dir: 'rtl' });
    fixture.detectChanges();
    expect(setLanguage).toHaveBeenCalledWith('ar');
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('calls logout without confirmation', () => {
    component.toggle();
    fixture.detectChanges();
    component.logout();
    fixture.detectChanges();
    expect(logoutFn).toHaveBeenCalled();
    expect(el().querySelector('[role="menu"]')).toBeNull();
  });

  it('exposes aria-haspopup and aria-expanded on the trigger', () => {
    const trigger = el().querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    component.toggle();
    fixture.detectChanges();
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  describe('theme row', () => {
    function themeRow(): HTMLButtonElement {
      return el().querySelectorAll<HTMLButtonElement>('[role="menuitem"]')[1];
    }

    function openMenuWithThemeRow(): void {
      component.toggle();
      fixture.detectChanges();
    }

    it('shows a theme row with three menuitemradio options', () => {
      openMenuWithThemeRow();
      themeRow().click();
      fixture.detectChanges();

      const radios = el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      expect(radios.length).toBe(3);
    });

    it('checks the active preference and applies a new one on click', () => {
      openMenuWithThemeRow();
      themeRow().click();
      fixture.detectChanges();

      const radios = el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      expect(radios[0].getAttribute('aria-checked')).toBe('true'); // light by default

      radios[1].click(); // Dark
      fixture.detectChanges();

      const service = TestBed.inject(ThemeService);
      expect(service.preference()).toBe('dark');
      expect(globalThis.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
      expect(el().querySelector('[role="menu"]')).toBeNull(); // choosing closes the menu
    });

    it('closes the languages flyout when the theme row opens', () => {
      openMenuWithThemeRow();
      component.toggleLanguages();
      fixture.detectChanges();

      themeRow().click();
      fixture.detectChanges();

      // The theme submenu replaced the language submenu.
      const radios = el().querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
      expect(radios.length).toBe(3);
    });
  });
});
