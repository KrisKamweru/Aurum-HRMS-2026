import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div data-testid="app-viewport" class="app-shell h-dvh overflow-hidden text-stone-900 dark:text-stone-100">
      <div data-testid="app-scroller" class="h-full overflow-y-auto overscroll-contain">
        <router-outlet />
      </div>
    </div>
  `
})
export class App {}
