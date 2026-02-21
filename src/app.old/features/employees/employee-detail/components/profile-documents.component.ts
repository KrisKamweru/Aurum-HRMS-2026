import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiIconComponent } from '../../../../shared/components/ui-icon/ui-icon.component';
import { UiModalComponent } from '../../../../shared/components/ui-modal/ui-modal.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { FieldConfig } from '../../../../shared/services/form-helper.service';
import { UiGridComponent } from '../../../../shared/components/ui-grid/ui-grid.component';
import { UiGridTileComponent } from '../../../../shared/components/ui-grid/ui-grid-tile.component';

@Component({
  selector: 'app-profile-documents',
  standalone: true,
  imports: [
    CommonModule,
    UiButtonComponent,
    UiIconComponent,
    UiModalComponent,
    DynamicFormComponent,
    UiGridComponent,
    UiGridTileComponent
  ],
  template: `
    <div class="space-y-4 sm:space-y-6">
      <div class="dash-frame">
        <ui-grid [columns]="'1fr'" [gap]="'0px'">
          <ui-grid-tile title="Documents" variant="compact">
            <ui-button size="sm" variant="ghost" tile-actions (onClick)="openModal()">
              <ui-icon name="plus" class="w-4 h-4 mr-1"></ui-icon> Upload
            </ui-button>

            <div class="tile-body">
              @if (documents().length === 0) {
                <div class="text-stone-500 dark:text-stone-400 italic text-sm text-center py-4">
                  No documents uploaded.
                </div>
              } @else {
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (doc of documents(); track doc._id) {
                    <div class="p-4 rounded-xl border border-stone-200 dark:border-white/8 bg-stone-50/50 dark:bg-white/5 hover:shadow-md transition-all group relative">
                      <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button (click)="delete.emit(doc._id)" class="p-1.5 text-stone-400 hover:text-red-600 bg-white dark:bg-white/5 rounded-full shadow-sm">
                          <ui-icon name="trash" class="w-4 h-4"></ui-icon>
                        </button>
                      </div>

                      <div class="flex flex-col items-center text-center mb-3">
                        <div class="w-12 h-12 rounded-lg bg-white dark:bg-white/5 border border-stone-200 dark:border-white/8 flex items-center justify-center text-stone-400 dark:text-stone-500 mb-3 shadow-sm">
                          <ui-icon [name]="getIconForType(doc.type)" class="w-6 h-6"></ui-icon>
                        </div>
                        <h4 class="font-bold text-stone-800 dark:text-stone-100 text-sm line-clamp-1 w-full" [title]="doc.name">{{ doc.name }}</h4>
                        <p class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wide mt-1">{{ doc.type.replace('_', ' ') }}</p>
                      </div>

                      <div class="text-xs text-stone-400 dark:text-stone-500 text-center border-t border-stone-100 dark:border-white/5 pt-2">
                        Uploaded {{ doc.uploadedAt | date:'mediumDate' }}
                      </div>

                      <a [href]="doc.url" target="_blank" class="absolute inset-0 z-0" [title]="'View ' + doc.name"></a>
                    </div>
                  }
                </div>
              }
            </div>
          </ui-grid-tile>
        </ui-grid>
      </div>
    </div>

    <!-- Modal -->
    <ui-modal
      [(isOpen)]="showModal"
      title="Upload Document"
    >
      <!-- Custom file upload content would go here, utilizing the generateUploadUrl endpoint -->
      <div class="p-4 text-center">
        <p class="text-stone-500 mb-4">File upload implementation requires Convex storage integration.</p>
        <p class="text-xs text-stone-400">For MVP, we'll simulate the metadata entry.</p>
      </div>

      <app-dynamic-form
        [fields]="config"
        [initialValues]="{}"
        [loading]="loading()"
        submitLabel="Upload"
        (formSubmit)="onSubmit($event)"
        (cancel)="showModal.set(false)"
        [showCancel]="true"
      ></app-dynamic-form>
    </ui-modal>
  `
})
export class ProfileDocumentsComponent {
  documents = input<any[]>([]);
  loading = input(false);

  save = output<any>();
  delete = output<string>();

  showModal = signal(false);

  config: FieldConfig[] = [
    { name: 'name', label: 'Document Name', type: 'text', required: true },
    {
      name: 'type',
      label: 'Document Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Contract', value: 'contract' },
        { label: 'ID Copy', value: 'id_copy' },
        { label: 'Resume/CV', value: 'resume' },
        { label: 'Certificate', value: 'certificate' },
        { label: 'Performance Review', value: 'performance_review' },
        { label: 'Other', value: 'other' }
      ]
    },
    { name: 'expiryDate', label: 'Expiry Date (Optional)', type: 'date' }
    // File input would be here
  ];

  openModal() {
    this.showModal.set(true);
  }

  onSubmit(data: any) {
    // Mock file ID for now until we implement full file upload component
    this.save.emit({ ...data, fileId: 'mock_file_id' });
    this.showModal.set(false);
  }

  getIconForType(type: string): string {
    switch (type) {
      case 'contract': return 'document-text';
      case 'id_copy': return 'identification';
      case 'resume': return 'user';
      case 'certificate': return 'academic-cap';
      default: return 'document';
    }
  }
}
