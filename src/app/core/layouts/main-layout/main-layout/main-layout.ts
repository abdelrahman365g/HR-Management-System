import { Component, computed, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../../services/auth';
import { DASHBOARD_NAV_ITEM, NAV_ITEMS, NavItem } from '../../../constants/nav-items.constant';
import { UserMenu } from '../../../../shared/components/user-menu/user-menu';

@Component({
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslatePipe, UserMenu],
  selector: 'app-main-layout',
  styleUrl: './main-layout.css',
  templateUrl: './main-layout.html',
})
export class MainLayout {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly drawerOpen = signal(false);

  protected readonly navItems = computed<NavItem[]>(() => {
    const items = [DASHBOARD_NAV_ITEM, ...NAV_ITEMS.filter((item) =>
      item.screen === 'dashboard' || this.auth.hasPermission(item.screen, 'view'),
    )];
    return items;
  });

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.drawerOpen.set(false);
      }
    });
  }

  toggleDrawer(): void {
    this.drawerOpen.set(!this.drawerOpen());
  }

  closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
