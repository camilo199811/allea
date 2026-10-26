
import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import { Header } from '../../components/header/header';
import { Footer } from '../../components/footer/footer';

import {
  AboutPageService
} from '../../services/about-page';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    Header,
    Footer
  ],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class About implements OnInit {

  readonly aboutService = inject(AboutPageService);

  readonly content = this.aboutService.content;
  readonly loading = this.aboutService.loading;
  readonly error = this.aboutService.error;

  ngOnInit(): void {
    void this.aboutService.loadContent();
  }
}
