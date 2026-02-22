import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { OrganizationPageStateComponent } from '../components/organization-page-state.component';
import { OrganizationRebuildStore } from '../data/organization-rebuild.store';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-user-linking-rebuild',
  imports: [OrganizationPageStateComponent],
  template: ''
})
export class UserLinkingRebuildComponent implements OnInit {
  private readonly store = inject(OrganizationRebuildStore);

  readonly pendingLinks = this.store.pendingUserLinks;
  readonly unlinkedEmployees = this.store.unlinkedEmployees;
  readonly linkedCount = this.store.linkedCount;
  readonly userLinkingLoading = this.store.userLinkingLoading;
  readonly isSaving = this.store.isSaving;
  readonly error = this.store.error;

  ngOnInit(): void {
    void this.store.loadUserLinkingData();
  }

  refresh(): void {
    void this.store.loadUserLinkingData();
  }

  selectedEmployeeId(userId: string): string {
    return this.store.selectedEmployeeForUser(userId) ?? '';
  }

  selectedEmployeeLabel(userId: string): string {
    const selected = this.selectedEmployeeId(userId);
    if (!selected) {
      return 'No suggestion';
    }
    const employee = this.unlinkedEmployees().find((row) => row.id === selected);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'No suggestion';
  }

  onEmployeeSelectionChange(userId: string, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }
    this.store.setSelectedEmployeeForUser(userId, target.value);
  }

  linkCandidate(id: string): void {
    void this.store.linkUserToEmployee(id);
  }
}


