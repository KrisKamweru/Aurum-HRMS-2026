import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  selector: 'app-locations-rebuild',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="min-h-screen bg-stone-50 px-4 py-8 text-stone-900 dark:bg-[#0b0b0b] dark:text-stone-100 sm:px-6 lg:px-8">
      <div class="mx-auto w-full max-w-5xl space-y-8">
        <header class="space-y-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-burgundy-700 dark:text-burgundy-400">Organization Rebuild</p>
          <h1 class="text-3xl font-semibold tracking-tight">Locations</h1>
          <p class="text-[15px] leading-normal text-stone-600 dark:text-stone-400">
            Office and site footprint scaffolding for the rebuilt organization module.
          </p>
        </header>

        <section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <form class="grid gap-3 sm:grid-cols-2" (submit)="addLocation(); $event.preventDefault()">
            <input
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-500"
              name="locationName"
              [(ngModel)]="newLocationNameModel"
              placeholder="Location name"
            />
            <input
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-500"
              name="locationCity"
              [(ngModel)]="newLocationCityModel"
              placeholder="City"
            />
            <input
              class="w-full rounded-lg border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-all placeholder:text-stone-400 focus:border-burgundy-500 focus:ring-2 focus:ring-burgundy-500/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-stone-500"
              name="locationCountry"
              [(ngModel)]="newLocationCountryModel"
              placeholder="Country"
            />
            <button type="submit" class="rounded-[10px] bg-burgundy-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(134,24,33,0.35)] transition-all hover:-translate-y-0.5 hover:bg-burgundy-600">
              Add Location
            </button>
          </form>
        </section>

        <section class="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-xl">
          <table class="min-w-full text-left">
            <thead class="bg-stone-50 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Location</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">City</th>
                <th class="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Country</th>
                <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (location of locations(); track location.id) {
                <tr class="border-t border-stone-100 transition-colors hover:bg-burgundy-50/50 dark:border-white/[0.03] dark:hover:bg-burgundy-700/[0.06]">
                  <td class="px-4 py-3 text-sm font-medium text-stone-800 dark:text-stone-200">{{ location.name }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.city }}</td>
                  <td class="px-4 py-3 text-sm text-stone-600 dark:text-stone-300">{{ location.country }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-stone-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
                      (click)="removeLocation(location.id)"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </section>
      </div>
    </main>
  `
})
export class LocationsRebuildComponent {
  private readonly store = inject(OrganizationRebuildStore);

  readonly locations = this.store.locations;
  readonly newLocationName = signal('');
  readonly newLocationCity = signal('');
  readonly newLocationCountry = signal('');

  get newLocationNameModel(): string {
    return this.newLocationName();
  }

  set newLocationNameModel(value: string) {
    this.newLocationName.set(value);
  }

  get newLocationCityModel(): string {
    return this.newLocationCity();
  }

  set newLocationCityModel(value: string) {
    this.newLocationCity.set(value);
  }

  get newLocationCountryModel(): string {
    return this.newLocationCountry();
  }

  set newLocationCountryModel(value: string) {
    this.newLocationCountry.set(value);
  }

  addLocation(): void {
    this.store.addLocation(this.newLocationName(), this.newLocationCity(), this.newLocationCountry());
    this.newLocationName.set('');
    this.newLocationCity.set('');
    this.newLocationCountry.set('');
  }

  removeLocation(id: string): void {
    this.store.removeLocation(id);
  }
}
