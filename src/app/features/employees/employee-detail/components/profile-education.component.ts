import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';

@Component({
  selector: 'app-profile-education',
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
      <ui-card>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
            <ui-icon name="academic-cap" class="w-5 h-5 text-indigo-500"></ui-icon>
            Education History
          </h3>
          <ui-button size="sm" variant="ghost" (onClick)="openModal()">
            <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Add
          </ui-button>
        </div>

        @if (education().length === 0) {
          <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
            No education history listed.
          </div>
        } @else {
          <div class="relative pl-4 border-l-2 border-stone-200 dark:border-stone-700 space-y-8">
            @for (edu of education(); track edu._id) {
              <div class="relative group">
                <!-- Timeline dot -->
                <div class="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-stone-300 dark:bg-stone-600 border-2 border-white dark:border-stone-900 group-hover:bg-indigo-500 transition-colors"></div>

                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-bold text-stone-800 dark:text-stone-100 text-lg">{{ edu.institution }}</h4>
                    <p class="text-indigo-600 dark:text-indigo-400 font-medium">{{ edu.degree }} in {{ edu.fieldOfStudy }}</p>
                    <div class="text-sm text-stone-500 dark:text-stone-400 mt-1 flex items-center gap-2">
                      <ui-icon name="calendar" class="w-3.5 h-3.5"></ui-icon>
                      {{ edu.startDate ? (edu.startDate | date:'getFullYear') : '?' }} - {{ edu.endDate ? (edu.endDate | date:'getFullYear') : 'Present' }}
                    </div>
                    @if (edu.grade) {
                      <p class="text-sm text-stone-600 dark:text-stone-300 mt-1">Grade/GPA: {{ edu.grade }}</p>
                    }
                  </div>

                  <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button (click)="edit(edu)" class="p-1.5 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
                      <ui-icon name="pencil" class="w-4 h-4"></ui-icon>
                    </button>
                    <button (click)="delete.emit(edu._id)" class="p-1.5 text-stone-400 hover:text-red-600">
                      <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </ui-card>
    </div>

    <!-- Modal -->
    <ui-modal
      [(isOpen)]="showModal"
      [title]="editingItem() ? 'Edit Education' : 'Add Education'"
    >
      <app-dynamic-form
        [fields]="config"
        [initialValues]="editingItem() || {}"
        [loading]="loading()"
        [submitLabel]="editingItem() ? 'Update' : 'Add'"
        (formSubmit)="onSubmit($event)"
        (cancel)="showModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `
})
export class ProfileEducationComponent {
  education = input<any[]>([]);
  loading = input(false);

  save = output<any>();
  delete = output<string>();

  showModal = signal(false);
  editingItem = signal<any>(null);

  config: FieldConfig[] = [
    { name: 'institution', label: 'Institution / University', type: 'text', required: true },
    { name: 'degree', label: 'Degree / Certificate', type: 'text', required: true },
    { name: 'fieldOfStudy', label: 'Field of Study', type: 'text', required: true },
    { name: 'startDate', label: 'Start Date', type: 'date' },
    { name: 'endDate', label: 'End Date (or blank if current)', type: 'date' },
    { name: 'grade', label: 'Grade / GPA', type: 'text' }
  ];

  openModal() {
    this.editingItem.set(null);
    this.showModal.set(true);
  }

  edit(item: any) {
    this.editingItem.set(item);
    this.showModal.set(true);
  }

  onSubmit(data: any) {
    if (this.editingItem()) {
      this.save.emit({ id: this.editingItem()._id, ...data });
    } else {
      this.save.emit(data);
    }
    this.showModal.set(false);
  }
}
