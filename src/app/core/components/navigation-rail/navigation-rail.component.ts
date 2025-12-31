import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ThemeService } from '../../services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  disabled?: boolean;
  // Additional paths that should also mark this nav item as active
  additionalActivePaths?: string[];
}

@Component({
  selector: 'app-navigation-rail',
  imports: [RouterLink],
  templateUrl: './navigation-rail.component.html',
  styleUrl: './navigation-rail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationRailComponent {
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // Current URL path (only update on actual navigation completion)
  private readonly currentPath = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url.split('?')[0])
    ),
    { initialValue: this.router.url.split('?')[0] }
  );

  protected readonly navItems: NavItem[] = [
    {
      path: '/',
      label: 'Home',
      icon: 'home',
    },
    {
      path: '/blog',
      label: 'Blog',
      icon: 'article',
      additionalActivePaths: ['/tags'],
    },
  ];

  // Check if a nav item should be active (including additional paths)
  protected isNavItemActive(item: NavItem): boolean {
    const path = this.currentPath();
    if (item.path === '/' && path === '/') return true;
    if (item.path !== '/' && path.startsWith(item.path)) return true;
    if (item.additionalActivePaths?.some((p) => path.startsWith(p))) return true;
    return false;
  }

  // Track expanded state for mobile
  protected readonly isExpanded = signal(false);

  protected toggleExpanded(): void {
    this.isExpanded.update((v) => !v);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
