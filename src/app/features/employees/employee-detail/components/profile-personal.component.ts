import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';

@Component({
  selector: 'app-profile-personal',
  standalone: true,
  imports: [
    CommonModule,
    UiCardComponent,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent
  ],
  template: `
    <div class="space-y-6">
      <!-- Emergency Contacts -->
      <ui-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <ui-icon name="users" class="w-5 h-5 text-red-500"></ui-icon>
            Emergency Contacts
          </h3>
          <ui-button size="sm" variant="ghost" (onClick)="openContactModal()">
            <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Add
          </ui-button>
        </div>

        @if (contacts().length === 0) {
          <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
            No emergency contacts listed.
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            @for (contact of contacts(); track contact._id) {
              <div class="p-4 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50/50 dark:bg-stone-800/30 relative group">
                <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button (click)="editContact(contact)" class="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                    <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
                  </button>
                  <button (click)="delete.emit(contact._id)" class="p-1 text-stone-400 hover:text-red-600">
                    <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                  </button>
                </div>

                <div class="flex items-center gap-2 mb-2">
                  <span class="font-bold text-stone-800 dark:text-stone-100">{{ contact.name }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300">
                    {{ contact.relationship }}
                  </span>
                  @if (contact.isPrimary) {
                    <span class="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Primary</span>
                  }
                </div>

                <div class="space-y-1 text-sm text-stone-600 dark:text-stone-400">
                  <div class="flex items-center gap-2">
                    <ui-icon name="phone" class="w-4 h-4"></ui-icon>
                    {{ contact.phone }}
                  </div>
                  @if (contact.email) {
                    <div class="flex items-center gap-2">
                      <ui-icon name="envelope" class="w-4 h-4"></ui-icon>
                      {{ contact.email }}
                    </div>
                  }
                  @if (contact.address) {
                    <div class="flex items-center gap-2">
                      <ui-icon name="map-pin" class="w-4 h-4"></ui-icon>
                      {{ contact.address }}
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </ui-card>
    </div>

    <!-- Contact Modal -->
    <ui-modal
      [(isOpen)]="showContactModal"
      [title]="editingContact() ? 'Edit Contact' : 'Add Emergency Contact'"
    >
      <app-dynamic-form
        [fields]="contactConfig"
        [initialValues]="editingContact() || {}"
        [loading]="loading()"
        [submitLabel]="editingContact() ? 'Update' : 'Add'"
        (formSubmit)="onContactSubmit($event)"
        (cancel)="showContactModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `
})
export class ProfilePersonalComponent {
  contacts = input<any[]>([]);
  loading = input(false);

  save = output<any>();
  delete = output<string>();

  showContactModal = signal(false);
  editingContact = signal<any>(null);

  contactConfig: FieldConfig[] = [
    { name: 'name', label: 'Full Name', type: 'text', required: true },
    { name: 'relationship', label: 'Relationship', type: 'text', required: true, placeholder: 'e.g. Spouse, Parent' },
    { name: 'phone', label: 'Phone Number', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'isPrimary', label: 'Primary Contact?', type: 'checkbox' }
  ];

  openContactModal() {
    this.editingContact.set(null);
    this.showContactModal.set(true);
  }

  editContact(contact: any) {
    this.editingContact.set(contact);
    this.showContactModal.set(true);
  }

  onContactSubmit(data: any) {
    if (this.editingContact()) {
      this.save.emit({ id: this.editingContact()._id, ...data });
    } else {
      this.save.emit(data);
    }
    this.showContactModal.set(false);
  }
}
