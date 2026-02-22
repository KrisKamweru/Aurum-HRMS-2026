import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export interface OrganizationTableColumn {
  label: string;
  align?: 'left' | 'right';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'thead[app-organization-table-header-row]',
  host: {
    class: 'bg-stone-50 dark:bg-white/[0.03]'
  },
  template: ''
})
export class OrganizationTableHeaderRowComponent {
  readonly columns = input.required<ReadonlyArray<OrganizationTableColumn>>();

  headerCellClass(column: OrganizationTableColumn): string {
    const base = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500';
    if (column.align === 'right') {
      return `${base} text-right`;
    }
    return base;
  }
}


