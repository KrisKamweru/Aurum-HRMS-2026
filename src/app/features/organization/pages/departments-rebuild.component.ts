import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-departments-rebuild',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 dark:bg-[#0b0b0b] dark:text-stone-100 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Departments</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            First rebuilt module slice. Data is local scaffold until Convex integration is reintroduced.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <form class="flex flex-col gap-3 sm:flex-row" (submit)="addDepartment(); $event.preventDefault()">
            <input
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-500"
              name="departmentName"
              [(ngModel)]="newDepartmentNameModel"
              placeholder="Add department name"
            />
            <button type="submit" class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600">
              Add Department
            </button>
          </form>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Department Name</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Headcount</th>
              </tr>
            </thead>
            <tbody>
              @for (department of departments(); track department.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ department.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ department.headcount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    </main>
  `
})
export class DepartmentsRebuildComponent {
  private readonly store = inject(OrganizationRebuildStore);

  readonly departments = this.store.departments;

  readonly newDepartmentName = signal('');

  get newDepartmentNameModel(): string {
    return this.newDepartmentName();
  }

  set newDepartmentNameModel(value: string) {
    this.newDepartmentName.set(value);
  }

  addDepartment(): void {
    this.store.addDepartment(this.newDepartmentName());
    this.newDepartmentName.set('');
  }
}
