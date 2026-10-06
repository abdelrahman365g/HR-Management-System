import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth';
import { LanguageService } from '../../../core/services/language';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../../../core/constants/languages.constant';
import {
  ThemePreference,
  ThemeService,
} from '../../../core/services/theme';

interface ThemeOption {
  value: ThemePreference;
  labelKey: string;
  icon: string;
}

@Component({
  selector: 'app-user-menu',
  imports: [TranslatePipe],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  protected readonly auth = inject(AuthService);
  protected readonly languageService = inject(LanguageService);
  protected readonly themeService = inject(ThemeService);
  private readonly translate = inject(TranslateService);
  private readonly host = inject(ElementRef<HTMLElement>);

  protected readonly languages = SUPPORTED_LANGUAGES;
  protected readonly open = signal(false);
  protected readonly languagesOpen = signal(false);
  protected readonly themeOpen = signal(false);

  protected readonly themeOptions: ThemeOption[] = [
    {
      value: 'light',
      labelKey: 'userMenu.themeLight',
      icon: 'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41',
    },
    {
      value: 'dark',
      labelKey: 'userMenu.themeDark',
      icon: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z',
    },
    {
      value: 'system',
      labelKey: 'userMenu.themeSystem',
      icon: 'M2 3h20v14H2zM8 21h8M12 17v4',
    },
  ];

  protected readonly isMobile = signal(false);
  protected readonly dir = this.languageService.dir;

  protected readonly initials = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || '?';
  });

  protected readonly groupName = computed(() => {
    if (this.auth.isHrAdmin()) return this.translate.instant('userMenu.hrAdmin');
    return this.auth.currentGroup()?.name ?? '';
  });

  private readonly menuId = `user-menu-${Math.random().toString(36).slice(2, 9)}`;

  constructor() {
    const mq = globalThis.matchMedia?.('(max-width: 1023px)');
    if (mq) {
      this.isMobile.set(mq.matches);
      mq.addEventListener('change', (e) => this.isMobile.set(e.matches));
    }
  }

  protected get menuElementId(): string {
    return this.menuId;
  }

  toggle(): void {
    this.open.set(!this.open());
    if (!this.open()) {
      this.languagesOpen.set(false);
      this.themeOpen.set(false);
    }
  }

  close(): void {
    this.open.set(false);
    this.languagesOpen.set(false);
    this.themeOpen.set(false);
  }

  toggleLanguages(): void {
    this.languagesOpen.set(!this.languagesOpen());
    if (this.languagesOpen()) this.themeOpen.set(false);
  }

  toggleTheme(): void {
    this.themeOpen.set(!this.themeOpen());
    if (this.themeOpen()) this.languagesOpen.set(false);
  }

  onThemeArrow(event: Event, direction: 'right' | 'left'): void {
    if (this.isMobile()) return;
    event.preventDefault();
    if (direction === 'right' && !this.themeOpen()) {
      this.themeOpen.set(true);
    } else if (direction === 'left' && this.themeOpen()) {
      this.themeOpen.set(false);
    }
  }

  chooseTheme(preference: ThemePreference): void {
    this.themeService.setTheme(preference);
    this.close();
  }

  onLanguagesArrow(event: Event, direction: 'right' | 'left'): void {
    if (this.isMobile()) return;
    event.preventDefault();
    if (direction === 'right' && !this.languagesOpen()) {
      this.languagesOpen.set(true);
    } else if (direction === 'left' && this.languagesOpen()) {
      this.languagesOpen.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.open()) return;
    const target = event.target as Node;
    if (!this.host.nativeElement.contains(target)) {
      this.close();
    }
  }

  chooseLanguage(language: SupportedLanguage): void {
    this.languageService.setLanguage(language.code);
    this.close();
  }

  isCurrentLanguage(language: SupportedLanguage): boolean {
    return this.languageService.current() === language.code;
  }

  logout(): void {
    this.close();
    void this.auth.logout();
  }
}
