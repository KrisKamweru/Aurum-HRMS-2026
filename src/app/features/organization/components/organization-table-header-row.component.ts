import { Component, Input } from '@angular/core';

export interface OrganizationTableColumn {
  label: string;
  align?: 'left' | 'right';
}

@Component({
  selector: 'thead[app-organization-table-header-row]',
  standalone: true,
  host: {
    class: 'bg-stone-50 dark:bg-white/[0.03]'
  },
  template: `
    <tr>
      @for (column of columns; track column.label) {
        <th [class]="headerCellClass(column)">{{ column.label }}</th>
      }
    </tr>
  `
})
export class OrganizationTableHeaderRowComponent {
  @Input({ required: true }) columns: ReadonlyArray<OrganizationTableColumn> = [];

  headerCellClass(column: OrganizationTableColumn): string {
    const base = 'px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500';
    if (column.align === 'right') {
      return `${base} text-right`;
    }
    return base;
  }
}
