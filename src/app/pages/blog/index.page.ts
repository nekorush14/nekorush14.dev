import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectContentFiles } from '@analogjs/content';
import { RouteMeta } from '@analogjs/router';
import PostAttributes from 'src/app/core/models/post-attributes';

// Redirect to home while blog is disabled
export const routeMeta: RouteMeta = {
  canActivate: [
    () => {
      const router = inject(Router);
      return router.createUrlTree(['/']);
    },
  ],
};

@Component({
  selector: 'app-blog-index',
  imports: [RouterLink],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
})
export default class BlogIndexPage {
  readonly posts = injectContentFiles<PostAttributes>((contentFile) =>
    contentFile.filename.includes('src/content/blog/')
  );
}
