import { Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'ui-step',
  standalone: true,
  template: `<ng-template #content><ng-content></ng-content></ng-template>`
})
export class UiStepComponent {
  @Input({ required: true }) title = '';
  @Input() subtitle?: string;

  @ViewChild('content', { static: true }) contentTemplate!: TemplateRef<unknown>;
}

