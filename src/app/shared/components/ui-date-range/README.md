# UI Date Range Picker Component

## Overview

The `UiDateRangeComponent` is a modern Angular v21+ inline date range picker that displays two months side-by-side with quick preset options. Built with signals and following the project's design system standards.

## Features

- **Dual-month calendar view** - Shows two consecutive months for easy range selection
- **Quick presets** - Built-in shortcuts for common date ranges (This Month, Last Month, Last 30 Days, This Year)
- **Date constraints** - Optional min/max date validation
- **Dark mode support** - Full support for light and dark themes
- **Keyboard accessible** - All interactive elements are keyboard navigable
- **Signal-based state** - Modern Angular v21+ implementation with signals
- **Hover preview** - Visual feedback when selecting the end date of a range

## Usage

### Basic Example

```typescript
import { Component, signal } from '@angular/core';
import { UiDateRangeComponent, DateRange } from '@shared/components/ui-date-range';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [UiDateRangeComponent],
  template: `
    <ui-date-range
      [startDate]="startDate()"
      [endDate]="endDate()"
      (rangeChange)="onRangeChange($event)"
    />
  `
})
export class MyComponent {
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  onRangeChange(range: DateRange) {
    this.startDate.set(range.start);
    this.endDate.set(range.end);
    console.log('Selected range:', range);
  }
}
```

### With Date Constraints

```typescript
import { Component, signal } from '@angular/core';
import { UiDateRangeComponent, DateRange } from '@shared/components/ui-date-range';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [UiDateRangeComponent],
  template: `
    <ui-date-range
      [startDate]="startDate()"
      [endDate]="endDate()"
      [minDate]="minDate"
      [maxDate]="maxDate"
      (rangeChange)="onRangeChange($event)"
    />
  `
})
export class MyComponent {
  startDate = signal<Date | null>(null);
  endDate = signal<Date | null>(null);

  // Only allow dates from the last 90 days
  maxDate = new Date();
  minDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() - 90);
    return date;
  })();

  onRangeChange(range: DateRange) {
    this.startDate.set(range.start);
    this.endDate.set(range.end);
  }
}
```

## API Reference

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `startDate` | `Date \| null` | `null` | The start date of the selected range |
| `endDate` | `Date \| null` | `null` | The end date of the selected range |
| `minDate` | `Date \| null` | `null` | Minimum selectable date (inclusive) |
| `maxDate` | `Date \| null` | `null` | Maximum selectable date (inclusive) |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `rangeChange` | `EventEmitter<DateRange>` | Emits when the date range changes |

### DateRange Interface

```typescript
interface DateRange {
  start: Date;  // Start date of the range (time stripped to 00:00:00)
  end: Date;    // End date of the range (time stripped to 00:00:00)
}
```

## Preset Options

The component includes four built-in presets:

| Preset | Description |
|--------|-------------|
| **This Month** | From the 1st of the current month to today |
| **Last Month** | The entire previous month (1st to last day) |
| **Last 30 Days** | From 30 days ago to today |
| **This Year** | From January 1st of the current year to today |

## Behavior

### Date Selection Flow

1. **First click**: Sets both start and end date to the clicked date
2. **Second click**: Updates the end date (or start date if clicked date is before current start)
3. **Subsequent clicks**: Resets the range and starts a new selection

### Visual States

- **Today**: Highlighted with a border in burgundy
- **Selected range**: Background in burgundy-100 (light) / burgundy-900/50 (dark)
- **Start/End dates**: Filled circle in burgundy-600 with white text
- **Hover preview**: Light burgundy background when hovering over potential end dates
- **Disabled dates**: Grayed out and not clickable (outside min/max constraints)

### Navigation

- **Previous/Next arrows**: Navigate between months
- **Month display**: Shows the names of both visible months
- The left and right months are always consecutive

## Design System Compliance

This component follows the Aurum HRMS design system:

- **Colors**: Uses burgundy-* palette for brand colors, stone-* for neutrals
- **Typography**: Text sizes range from text-xs to text-sm, with appropriate font weights
- **Spacing**: Consistent padding (p-4) and gaps (gap-2, gap-6)
- **Border radius**: Follows design system standards (rounded-xl for container, rounded-full for date buttons)
- **Dark mode**: Full support with `dark:` variants on all color properties
- **Transitions**: Smooth color transitions on all interactive elements

## Accessibility

- All interactive elements are keyboard accessible (Tab navigation)
- Disabled dates cannot be selected
- Visual indicators for all states (selected, hover, disabled)
- Semantic HTML buttons for all clickable elements
- Clear visual feedback for user interactions

## Implementation Notes

### Modern Angular v21+ Patterns

This component demonstrates all required modern Angular patterns:

- ✅ **Signal inputs**: `input()` for all component inputs
- ✅ **Signal outputs**: `output()` for event emission
- ✅ **Computed signals**: `computed()` for derived values (month labels, day arrays)
- ✅ **Signal state**: `signal()` for internal component state
- ✅ **inject()**: No constructor injection
- ✅ **Modern template syntax**: Uses `@for` control flow for iteration
- ✅ **No decorators**: No `@Input`, `@Output`, `@ViewChild`, etc.
- ✅ **Standalone**: Component is standalone by default

### Performance Considerations

- Month day calculations are memoized via `computed()` signals
- Only re-renders affected date buttons on state changes
- No unnecessary DOM manipulation
- Efficient date comparison using stripped time values

## Testing

To test the component:

1. Navigate to `/demo/date-picker` in the running application
2. Try different preset buttons
3. Click dates to select a range
4. Test min/max constraints in the second example
5. Verify dark mode compatibility by toggling the theme

## Future Enhancements

Potential future improvements:

- Time selection for date-time ranges
- Custom preset definitions via input
- i18n support for month/day names
- Week selection mode
- Single date picker mode (non-range)
- Custom date formatting options
- Animation on month transitions
