import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';
import { injectResponse } from '@analogjs/router/tokens';
import { OgpService } from '../core/services/ogp.service';

export const routeMeta: RouteMeta = {
  title: '404 - Page Not Found | nekorush14.dev',
  canActivate: [
    () => {
      const response = injectResponse();
      // Set 404 status code on SSR
      if (import.meta.env.SSR && response) {
        response.statusCode = 404;
      }
      return true;
    },
  ],
};

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  templateUrl: './[...not-found].page.html',
  styleUrl: './[...not-found].page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFoundPage {
  private readonly ogpService = inject(OgpService);

  constructor() {
    this.ogpService.updateMetadata({
      title: '404 - Page Not Found | nekorush14.dev',
      description: 'The page you are looking for does not exist.',
      url: 'https://nekorush14.dev/404',
      type: 'website',
    });
  }
}
