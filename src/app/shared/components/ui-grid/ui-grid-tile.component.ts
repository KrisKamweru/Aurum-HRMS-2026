import { Component, input, ChangeDetectionStrategy } from '@angular/core';

export type GridTileVariant = 'default' | 'compact' | 'glass' | 'flat';
export type GridTileDivider = 'none' | 'right' | 'bottom';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'ui-grid-tile',
  template: ''
})
export class UiGridTileComponent {
  readonly title = input('');
  readonly minHeight = input('auto');
  readonly minHeightMobile = input('');
  readonly variant = input<GridTileVariant>('default');
  readonly divider = input<GridTileDivider>('none');

  containerClasses(): string {
    const dividerMap: Record<GridTileDivider, string> = {
      none: '',
      right: 'border-r border-stone-200 dark:border-white/8',
      bottom: 'border-b border-stone-200 dark:border-white/8'
    };
    return `flex min-h-0 flex-col overflow-hidden ${dividerMap[this.divider()]}`.trim();
  }

  headerClasses(): string {
    const base = 'flex h-[46px] items-center justify-between border-b border-stone-200 px-5 py-3 dark:border-white/8';
    const variantMap: Record<GridTileVariant, string> = {
      default: 'bg-[#eeedf0] dark:bg-white/[0.02]',
      compact: 'h-10 bg-[#eeedf0] px-4 py-2 dark:bg-white/[0.02]',
      glass: 'bg-white/[0.72] backdrop-blur-xl dark:bg-white/5 dark:backdrop-blur-xl',
      flat: 'bg-transparent'
    };
    return `${base} ${variantMap[this.variant()]}`;
  }
}



