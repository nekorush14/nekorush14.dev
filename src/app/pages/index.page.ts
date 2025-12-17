import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { siGithub, siMisskey, siWantedly, siX } from 'simple-icons';


/**
 * Represents a social media link with icon
 */
interface SocialLink {
  name: string;
  url: string;
  path: string; // SVG path data
  viewBox: string; // SVG viewBox (e.g., "0 0 24 24")
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './index.page.html',
  styleUrl: './index.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class HomePage {
  // Profile information
  protected readonly name = signal('nekorush14');
  protected readonly subName = signal('Mitsuhiro Komuro');
  // protected readonly role = signal('Backend Engineer');
  protected readonly bio = signal(
    `Software engineer. MSc in Computer Information Science.
    Interests: Human-like AI Assistants, Cloud, Android, Genrative AI
    Hobbies: Stargazing, Game, Anime, Comics, Music, and more.
    `
  );

  // Social media links using simple-icons and Font Awesome
  protected readonly socialLinks = signal<SocialLink[]>([
    {
      name: 'GitHub',
      url: 'https://github.com/nekorush14',
      path: siGithub.path,
      viewBox: '0 0 24 24',
    },
    {
      name: 'X.com',
      url: 'https://x.com/nekorush14',
      path: siX.path,
      viewBox: '0 0 24 24',
    },
    {
      name: 'Misskey.io',
      url: 'https://misskey.io/@l10es',
      path: siMisskey.path,
      viewBox: '0 0 24 24',
    },
    {
      name: 'Wantedly',
      url: 'https://www.wantedly.com/id/nekorush14',
      path: siWantedly.path,
      viewBox: '0 0 24 24',
    },
    {
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/nekorush14',
      path: faLinkedin.icon[4] as string,
      viewBox: `0 0 ${faLinkedin.icon[0]} ${faLinkedin.icon[1]}`,
    },
  ]);
}
