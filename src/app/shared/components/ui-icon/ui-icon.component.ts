import { Component, input, ChangeDetectionStrategy } from '@angular/core';

interface IconDefinition {
  viewBox: string;
  paths: string[];
  stroke?: boolean;
}

const ICONS: Record<string, IconDefinition> = {
  check: { viewBox: '0 0 24 24', paths: ['M5 13l4 4L19 7'], stroke: true },
  'chevron-up': { viewBox: '0 0 24 24', paths: ['M6 15l6-6 6 6'], stroke: true },
  'chevron-down': { viewBox: '0 0 24 24', paths: ['M6 9l6 6 6-6'], stroke: true },
  'chevron-left': { viewBox: '0 0 24 24', paths: ['M15 19l-7-7 7-7'], stroke: true },
  'chevron-right': { viewBox: '0 0 24 24', paths: ['M9 5l7 7-7 7'], stroke: true },
  selector: { viewBox: '0 0 20 20', paths: ['M10 6l-3 3h6l-3-3zm0 8l3-3H7l3 3z'] },
  inbox: { viewBox: '0 0 24 24', paths: ['M3 5h18v12h-4l-2 2h-6l-2-2H3z'], stroke: true },
  bell: {
    viewBox: '0 0 24 24',
    paths: ['M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 0 1-6 0'],
    stroke: true
  },
  'x-mark': { viewBox: '0 0 24 24', paths: ['M6 6l12 12M18 6L6 18'], stroke: true },
  'x-circle': { viewBox: '0 0 24 24', paths: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm3.54 12.46a1 1 0 0 1-1.42 1.42L12 13.41l-2.12 2.47a1 1 0 1 1-1.42-1.42L10.59 12 8.46 9.88a1 1 0 0 1 1.42-1.42L12 10.59l2.12-2.13a1 1 0 0 1 1.42 1.42L13.41 12z'], stroke: false },
  'exclamation-triangle': {
    viewBox: '0 0 24 24',
    paths: ['M12 9v4m0 4h.01M10.3 3.9l-8.1 14A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-3.1l-8.1-14a2 2 0 0 0-3.4 0z'],
    stroke: true
  },
  'information-circle': {
    viewBox: '0 0 24 24',
    paths: ['M12 8h.01M11 12h1v4h1m-1-13a9 9 0 1 0 0 18 9 9 0 0 0 0-18'],
    stroke: true
  }
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-icon',
  template: `
    <svg 
      [attr.viewBox]="icon().viewBox" 
      [attr.fill]="icon().stroke ? 'none' : 'currentColor'" 
      [attr.stroke]="icon().stroke ? 'currentColor' : 'none'" 
      [attr.stroke-width]="icon().stroke ? '2' : null" 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      class="w-full h-full"
    >
      @for (path of icon().paths; track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  host: {
    class: 'inline-block leading-none'
  }
})
export class UiIconComponent {
  readonly name = input.required<string>();

  icon(): IconDefinition {
    return (
      ICONS[this.name()] ?? {
        viewBox: '0 0 24 24',
        paths: ['M12 6v6m0 6h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18'],
        stroke: true
      }
    );
  }
}


