import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div data-testid="app-viewport" class="h-dvh overflow-hidden bg-stone-50 dark:bg-[#0b0b0b]">
      <div data-testid="app-scroller" class="h-full overflow-y-auto overscroll-contain">
        <router-outlet />
      </div>
    </div>
  `
})
export class App {}
