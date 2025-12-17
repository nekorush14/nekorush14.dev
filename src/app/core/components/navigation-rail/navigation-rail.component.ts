import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../services/theme.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-navigation-rail',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navigation-rail.component.html',
  styleUrl: './navigation-rail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavigationRailComponent {
  protected readonly themeService = inject(ThemeService);

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
      disabled: true,
    },
  ];

  // Track expanded state for mobile
  protected readonly isExpanded = signal(false);

  protected toggleExpanded(): void {
    this.isExpanded.update((v) => !v);
  }

  protected toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
