import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { MainLayout } from './main-layout';
import { AuthService } from '../../../services/auth';
import { provideTranslateTesting } from '../../../../../testing/translate-testing';

/**
 * Shell regression specs: nav items must be real links that navigate, the
 * user block must open its menu, and no overlay/scrim may exist in the DOM
 * while the drawer and menus are closed.
 */
describe('MainLayout navigation', () => {
  let fixture: ComponentFixture<MainLayout>;
  let router: Router;

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainLayout],
      providers: [
        provideRouter([
          // Real path shape so clicks resolve; the lazy targets are stubs.
          { path: 'dashboard', component: MainLayout },
          { path: 'employees', component: MainLayout },
          { path: 'departments', component: MainLayout },
          { path: 'attendance', children: [] },
          { path: 'salary-reports', children: [] },
          { path: 'official-holidays', children: [] },
          { path: 'settings', children: [] },
          { path: 'users', children: [] },
          { path: 'permission-groups', children: [] },
        ]),
        provideTranslateTesting(),
        {
          provide: AuthService,
          useValue: {
            currentUser: () => ({
              id: '1',
              full_name: 'Admin User',
              username: 'admin',
              email: 'a@b.c',
              permission_group_id: null,
              is_hr_admin: true,
              is_active: true,
            }),
            currentGroup: () => null,
            isHrAdmin: () => true,
            hasPermission: () => true,
            logout: () => Promise.resolve(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(MainLayout);
    fixture.detectChanges();
  });

  it('renders every nav item as a real link with an href', () => {
    const links = Array.from(el().querySelectorAll<HTMLAnchorElement>('aside nav a'));
    expect(links.length).toBeGreaterThan(1);
    for (const link of links) {
      expect(link.getAttribute('href')).toMatch(/^\/(dashboard|employees|departments|attendance|salary-reports|official-holidays|settings|users|permission-groups)$/);
    }
  });

  it('navigates when a nav item is clicked', async () => {
    const link = el().querySelector<HTMLAnchorElement>('aside nav a[href="/employees"]');
    expect(link).toBeTruthy();
    link!.click();
    await fixture.whenStable();
    expect(router.url).toBe('/employees');
  });

  it('marks the active nav item with the active class after navigation', async () => {
    const link = el().querySelector<HTMLAnchorElement>('aside nav a[href="/dashboard"]');
    link!.click();
    await fixture.whenStable();
    fixture.detectChanges();
    const active = el().querySelector<HTMLAnchorElement>('aside nav a[href="/dashboard"]');
    expect(active!.classList.contains('nav-item-active')).toBe(true);
  });

  it('opens the user menu when the user block is clicked', () => {
    const trigger = el().querySelector<HTMLButtonElement>('app-user-menu button[aria-haspopup="menu"]');
    expect(trigger).toBeTruthy();
    trigger!.click();
    fixture.detectChanges();
    expect(el().querySelector('app-user-menu [role="menu"]')).toBeTruthy();
  });

  it('has no scrim/overlay element in the DOM while the drawer is closed', () => {
    expect(el().querySelector('.fixed.inset-0.bg-ink\\/60, [aria-hidden].fixed.inset-0')).toBeNull();
    expect(componentDrawerOpen()).toBe(false);
  });

  it('shows the drawer scrim only while the drawer is open', () => {
    const component = fixture.componentInstance as MainLayout & { drawerOpen: () => boolean };
    component.toggleDrawer();
    fixture.detectChanges();
    // The scrim is @if-mounted and aria-hidden.
    const scrim = el().querySelector('div[aria-hidden="true"].fixed.inset-0');
    expect(scrim).toBeTruthy();
    component.closeDrawer();
    fixture.detectChanges();
    expect(el().querySelector('div[aria-hidden="true"].fixed.inset-0')).toBeNull();
  });

  it('does not set inert on the sidebar (would break desktop clicks)', () => {
    const aside = el().querySelector('aside');
    expect(aside).toBeTruthy();
    expect(aside!.hasAttribute('inert')).toBe(false);
  });

  function componentDrawerOpen(): boolean {
    const component = fixture.componentInstance as MainLayout & { drawerOpen: () => boolean };
    return component.drawerOpen();
  }
});
