import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiAvatarComponent } from '../../../../shared/components/ui-avatar/ui-avatar.component';

@Component({
  selector: 'app-org-node',
  standalone: true,
  imports: [CommonModule, UiAvatarComponent],
  template: `
    <div class="flex flex-col items-center">
      <div class="relative group z-10">
        <!-- Node Card -->
        <div class="bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-stone-200 dark:border-white/8 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-burgundy-700 dark:hover:border-burgundy-700 transition-all w-64 text-center relative z-10">
          <div class="flex flex-col items-center">
            <ui-avatar
              [src]="node.image"
              [name]="node.firstName + ' ' + node.lastName"
              size="md"
              class="mb-3"
            ></ui-avatar>

            <h3 class="font-bold text-stone-800 dark:text-stone-100 truncate w-full" [title]="node.firstName + ' ' + node.lastName">
              {{ node.firstName }} {{ node.lastName }}
            </h3>

            <p class="text-xs text-[#8b1e3f] dark:text-[#fce7eb] font-medium uppercase tracking-wide truncate w-full" [title]="node.designationName">
              {{ node.designationName }}
            </p>

            <div class="mt-2 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
              <span class="flex items-center gap-1" *ngIf="node.directReports?.length">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-3 h-3">
                  <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
                </svg>
                {{ node.directReports.length }} reports
              </span>
            </div>
          </div>
        </div>

        <!-- Connector Line (Vertical from bottom) -->
        <div *ngIf="node.directReports?.length" class="absolute left-1/2 bottom-0 w-px h-8 bg-stone-300 dark:bg-stone-600 translate-y-full"></div>
      </div>

      <!-- Children Container -->
      <div *ngIf="node.directReports?.length" class="mt-8 flex gap-8 items-start relative">
        <!-- Horizontal connector line connecting all children -->
        <div class="absolute top-0 left-0 right-0 h-px bg-stone-300 dark:bg-stone-600 -translate-y-px"
             style="left: calc(50% / {{node.directReports.length}} + 2rem); right: calc(50% / {{node.directReports.length}} + 2rem);"
             *ngIf="node.directReports.length > 1"></div>

        <app-org-node
          *ngFor="let child of node.directReports; let first = first; let last = last"
          [node]="child"
          class="relative"
        >
          <!-- Vertical line connecting to the horizontal line above -->
          <div class="absolute -top-8 left-1/2 w-px h-8 bg-stone-300 dark:bg-stone-600"></div>
        </app-org-node>
      </div>
    </div>
  `
})
export class OrgNodeComponent {
  @Input() node: any;
}
