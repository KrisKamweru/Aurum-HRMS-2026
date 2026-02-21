import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-organization-list-toolbar-actions',
  standalone: true,
  template: `
    <button
      type="button"
      class="rounded-[10px] border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-200 dark:hover:bg-white/10"
      [disabled]="disabled"
      (click)="refreshRequested.emit()"
    >
      {{ refreshLabel }}
    </button>
    <button
      type="button"
      class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600 disabled:cursor-not-allowed disabled:opacity-60"
      [disabled]="disabled"
      (click)="createRequested.emit()"
    >
      {{ createLabel }}
    </button>
  `
})
export class OrganizationListToolbarActionsComponent {
  @Input() refreshLabel = 'Refresh';
  @Input() createLabel = 'Create';
  @Input() disabled = false;

  @Output() refreshRequested = new EventEmitter<void>();
  @Output() createRequested = new EventEmitter<void>();
}
