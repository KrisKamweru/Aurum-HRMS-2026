import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-organization-table-actions',
  standalone: true,
  template: `
    <button
      type="button"
      class="mr-2 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-burgundy-300 hover:bg-burgundy-50 hover:text-burgundy-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-300 dark:hover:border-burgundy-500/40 dark:hover:bg-burgundy-700/10 dark:hover:text-burgundy-300"
      [disabled]="disabled"
      (click)="editRequested.emit()"
    >
      Edit
    </button>
    <button
      type="button"
      class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/8 dark:text-stone-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
      [disabled]="disabled"
      (click)="removeRequested.emit()"
    >
      Remove
    </button>
  `
})
export class OrganizationTableActionsComponent {
  @Input() disabled = false;

  @Output() editRequested = new EventEmitter<void>();
  @Output() removeRequested = new EventEmitter<void>();
}
