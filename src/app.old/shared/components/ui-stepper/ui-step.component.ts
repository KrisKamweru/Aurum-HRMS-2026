import { Component, input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'ui-step',
  template: `<ng-template #content><ng-content></ng-content></ng-template>`
})
export class UiStepComponent {
  title = input.required<string>();
  subtitle = input<string>();

  // Template reference for the parent to access
  @ViewChild('content', { static: true }) contentTemplate!: TemplateRef<unknown>;
}
