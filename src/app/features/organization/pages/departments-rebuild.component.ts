import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DepartmentRow {
  id: string;
  name: string;
  headcount: number;
}

@Component({
  selector: 'app-departments-rebuild',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs uppercase tracking-[0.2em] text-slate-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Departments</h1>
          <p class="text-sm text-slate-300">
            First rebuilt module slice. Data is local scaffold until Convex integration is reintroduced.
          </p>
        </header>

        <section class="rounded-xl border border-slate-700 bg-slate-900 p-5">
          <form class="flex flex-col gap-3 sm:flex-row" (submit)="addDepartment(); $event.preventDefault()">
            <input
              class="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-slate-400"
              name="departmentName"
              [(ngModel)]="newDepartmentNameModel"
              placeholder="Add department name"
            />
            <button type="submit" class="rounded-lg border border-cyan-500 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20">
              Add Department
            </button>
          </form>
        </section>

        <section class="overflow-hidden rounded-xl border border-slate-700 bg-slate-900">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-800/80 text-slate-300">
              <tr>
                <th class="px-4 py-3 font-medium">Department Name</th>
                <th class="px-4 py-3 font-medium">Headcount</th>
              </tr>
            </thead>
            <tbody>
              @for (department of departments(); track department.id) {
                <tr class="border-t border-slate-800">
                  <td class="px-4 py-3">{{ department.name }}</td>
                  <td class="px-4 py-3 text-slate-300">{{ department.headcount }}</td>
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
  readonly departments = signal<DepartmentRow[]>([
    { id: 'dept-hr', name: 'Human Resources', headcount: 4 },
    { id: 'dept-eng', name: 'Engineering', headcount: 8 }
  ]);

  readonly newDepartmentName = signal('');

  get newDepartmentNameModel(): string {
    return this.newDepartmentName();
  }

  set newDepartmentNameModel(value: string) {
    this.newDepartmentName.set(value);
  }

  addDepartment(): void {
    const value = this.newDepartmentName().trim();
    if (!value) {
      return;
    }

    const exists = this.departments().some((department) => department.name.toLowerCase() === value.toLowerCase());
    if (exists) {
      this.newDepartmentName.set('');
      return;
    }

    this.departments.update((rows) => [
      ...rows,
      {
        id: `dept-${rows.length + 1}`,
        name: value,
        headcount: 0
      }
    ]);
    this.newDepartmentName.set('');
  }
}
