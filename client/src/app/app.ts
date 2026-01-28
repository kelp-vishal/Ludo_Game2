

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { NgIf } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { NxWelcome } from './nx-welcome';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  showHeader = false;

  constructor(private router: Router) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const path = event.urlAfterRedirects.split('?')[0].split('#')[0];
        this.showHeader = path !== '/ludo-board';
      }
    });
  }
}
