# Timeline UI Components

## Overview

The Timeline UI is the core visualization component of SignalBoard, displaying upcoming market catalysts in an interactive, glass morphism-styled interface.

## Architecture

### Components

1. **Timeline** - Main container component with virtualization
   - Horizontal scrolling on desktop
   - Vertical scrolling on mobile (<768px)
   - Uses `@tanstack/react-virtual` for performance
   - Integrates `react-zoom-pan-pinch` for desktop zoom/pan

2. **CatalystNode** - Individual catalyst display card
   - Glass morphism styling with dynamic glow based on impact score
   - Shows ticker, title, date, and impact visualization
   - Animated with Framer Motion

3. **CatalystDetailPanel** - Slide-out detail panel
   - Shows full catalyst information
   - Impact and confidence scores
   - Action buttons (alerts, watchlist, prediction game)
   - Metadata display

### Styling

- Glass morphism effects defined in `globals.css`
- CSS variables for consistent theming
- Responsive breakpoints for mobile/desktop

### Data Flow

```
useCatalysts (hook) → Timeline → CatalystNode
                              ↘ CatalystDetailPanel
```

## Usage

```tsx
import { Timeline } from '@/components/Timeline';
import { useCatalysts } from '@/hooks/useCatalysts';

function App() {
  const { catalysts, loading, error } = useCatalysts();
  const [selected, setSelected] = useState(null);
  
  return (
    <Timeline
      catalysts={catalysts}
      onCatalystSelect={setSelected}
      selectedCatalystId={selected?.id}
    />
  );
}
```

## Performance Considerations

- Virtual scrolling handles 100+ catalysts efficiently
- Images and heavy content lazy-loaded
- Animations use GPU-accelerated transforms
- Real-time updates via Supabase subscriptions

## Mobile Responsiveness

- <768px: Vertical timeline with swipe gestures
- Touch-optimized interactions
- Reduced glass blur for performance
- Full-screen detail panel on mobile