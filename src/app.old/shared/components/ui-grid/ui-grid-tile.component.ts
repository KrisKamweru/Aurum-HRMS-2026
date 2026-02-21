import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-grid-tile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-grid-tile" [class.has-divider]="divider === 'right' || divider === 'bottom'">
      <div class="ui-grid-tile-head">
        <span class="ui-grid-tile-title">{{ title }}</span>
        <div class="ui-grid-tile-actions">
          <ng-content select="[tile-actions]"></ng-content>
        </div>
      </div>
      <div class="ui-grid-tile-body">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 0;
    }

    .ui-grid-tile {
      display: flex;
      flex-direction: column;
      min-height: var(--ui-grid-tile-min-height, auto);
    }

    .ui-grid-tile-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.7rem 1.25rem;
      height: 46px;
      border-bottom: 1px solid #e7e5e4;
      background: var(--surface-header);
    }
    :host-context(.dark) .ui-grid-tile-head {
      border-color: rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
    }

    :host(.ui-grid-tile--flat) .ui-grid-tile-head {
      background: transparent;
    }

    :host(.ui-grid-tile--glass) .ui-grid-tile-head {
      background: rgba(250,250,249,0.7);
      backdrop-filter: blur(10px);
    }
    :host-context(.dark).ui-grid-tile--glass .ui-grid-tile-head {
      background: rgba(255,255,255,0.05);
    }

    :host(.ui-grid-tile--compact) .ui-grid-tile-head {
      height: 40px;
      padding: 0.5rem 1rem;
    }

    .ui-grid-tile-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #57534e;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    :host-context(.dark) .ui-grid-tile-title { color: #a8a29e; }
    :host(.ui-grid-tile--compact) .ui-grid-tile-title {
      font-size: 0.7rem;
      letter-spacing: 0.04em;
    }

    .ui-grid-tile-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      min-height: 0;
    }

    .ui-grid-tile-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    :host([divider="right"]) .ui-grid-tile {
      border-right: 1px solid #e7e5e4;
    }
    :host-context(.dark)[divider="right"] .ui-grid-tile {
      border-color: rgba(255,255,255,0.08);
    }

    :host([divider="bottom"]) .ui-grid-tile {
      border-bottom: 1px solid #e7e5e4;
    }
    :host-context(.dark)[divider="bottom"] .ui-grid-tile {
      border-color: rgba(255,255,255,0.08);
    }

    @media (max-width: 900px) {
      .ui-grid-tile {
        min-height: var(--ui-grid-tile-min-height-mobile, var(--ui-grid-tile-min-height, auto));
      }

      :host([divider="right"]) .ui-grid-tile {
        border-right: none;
        border-bottom: 1px solid #e7e5e4;
      }
      :host-context(.dark)[divider="right"] .ui-grid-tile {
        border-color: rgba(255,255,255,0.08);
      }
    }
  `],
  host: {
    '[attr.divider]': 'divider',
    '[class.ui-grid-tile--compact]': 'variant === "compact"',
    '[class.ui-grid-tile--glass]': 'variant === "glass"',
    '[class.ui-grid-tile--flat]': 'variant === "flat"',
    '[style.--ui-grid-tile-min-height]': 'minHeight',
    '[style.--ui-grid-tile-min-height-mobile]': 'minHeightMobile',
    '[attr.title]': 'null'
  }
})
export class UiGridTileComponent {
  @Input() title = '';
  @Input() minHeight = 'auto';
  @Input() minHeightMobile = '';
  @Input() variant: 'default' | 'compact' | 'glass' | 'flat' = 'default';
  @Input() divider: 'none' | 'right' | 'bottom' = 'none';
}
