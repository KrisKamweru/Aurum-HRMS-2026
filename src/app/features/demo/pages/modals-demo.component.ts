import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../shared/components/ui-button/ui-button.component';
import { UiCardComponent } from '../../../shared/components/ui-card/ui-card.component';
import { UiModalComponent } from '../../../shared/components/ui-modal/ui-modal.component';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-modals-demo',
  standalone: true,
  imports: [CommonModule, UiButtonComponent, UiCardComponent, UiModalComponent],
  template: `
    <div class="space-y-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Toasts</h2>
        <ui-card>
          <div class="flex flex-wrap gap-4">
            <ui-button (onClick)="showSuccess()">Success Toast</ui-button>
            <ui-button (onClick)="showError()" variant="danger">Error Toast</ui-button>
            <ui-button (onClick)="showInfo()" variant="secondary">Info Toast</ui-button>
            <ui-button (onClick)="showWarning()" variant="outline">Warning Toast</ui-button>
          </div>
        </ui-card>
      </div>

      <div>
        <h2 class="text-2xl font-bold text-gray-900 mb-4">Modals</h2>
        <ui-card>
          <div class="flex flex-wrap gap-4">
            <ui-button (onClick)="isModalOpen.set(true)">Open Basic Modal</ui-button>
            <ui-button (onClick)="isLargeModalOpen.set(true)" variant="secondary">Open Large Modal</ui-button>
          </div>
        </ui-card>
      </div>
    </div>

    <!-- Basic Modal -->
    <ui-modal
      [isOpen]="isModalOpen()"
      title="Confirmation"
      (close)="isModalOpen.set(false)"
    >
      <p class="text-gray-600">
        Are you sure you want to proceed with this action? This cannot be undone.
      </p>

      <div footer class="flex gap-3">
        <ui-button variant="danger" (onClick)="confirmAction()">Confirm</ui-button>
        <ui-button variant="outline" (onClick)="isModalOpen.set(false)">Cancel</ui-button>
      </div>
    </ui-modal>

    <!-- Large Modal -->
    <ui-modal
      [isOpen]="isLargeModalOpen()"
      title="Employee Details"
      size="lg"
      (close)="isLargeModalOpen.set(false)"
    >
      <div class="space-y-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium text-gray-900">Personal Information</h4>
          <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
            <div><span class="text-gray-500">Name:</span> Sarah Connor</div>
            <div><span class="text-gray-500">Email:</span> sarah@skynet.com</div>
            <div><span class="text-gray-500">Role:</span> Resistance Leader</div>
            <div><span class="text-gray-500">ID:</span> #84920</div>
          </div>
        </div>
        <p class="text-gray-600">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
      </div>

      <div footer>
        <ui-button (onClick)="isLargeModalOpen.set(false)">Close</ui-button>
      </div>
    </ui-modal>
  `
})
export class ModalsDemoComponent {
  private toast = inject(ToastService);

  isModalOpen = signal(false);
  isLargeModalOpen = signal(false);

  showSuccess() {
    this.toast.success('Operation completed successfully!');
  }

  showError() {
    this.toast.error('Something went wrong. Please try again.');
  }

  showInfo() {
    this.toast.info('New updates are available.');
  }

  showWarning() {
    this.toast.warning('Your session is about to expire.');
  }

  confirmAction() {
    this.isModalOpen.set(false);
    this.toast.success('Action confirmed!');
  }
}
