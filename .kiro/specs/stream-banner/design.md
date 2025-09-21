# Design Document

## Overview

The Stream Banner feature is a TV ticker-style component system that displays dynamic content with a main title area and an infinite scrolling carousel at the bottom. The system follows the established patterns from the sponsors module, providing a consistent administrative interface and data management approach.

The feature consists of three main components:
1. **Data Model & API Layer** - Following the same schema and REST API patterns as sponsors
2. **Management Interface** - Administrative UI for creating, editing, and managing banner content
3. **Display Component** - The actual stream overlay component with main title and carousel

## Architecture

### Data Flow
```
Tournament Admin → Management Interface → API Routes → Database → Display Component
```

### Component Hierarchy
```
StreamBannerPage (Management)
├── StreamBannerManager
├── StreamBannerForm
├── StreamBannerList
├── StreamBannerPreview
└── OBSDisplayInfo

StreamBannerDisplay (OBS Overlay)
├── MainTitle
└── CarouselTicker
    └── CarouselItem[]
```

## Components and Interfaces

### Data Models

#### StreamBanner Interface
```typescript
interface StreamBanner {
  _id: string;
  title: string;
  carouselItems: CarouselItem[];
  displayDuration: number; // seconds for main title display
  carouselSpeed: number; // pixels per second for carousel
  isActive: boolean;
  priority: number; // for ordering multiple banners
  createdAt: Date;
  updatedAt: Date;
}

interface CarouselItem {
  id: string;
  text: string;
  backgroundColor?: string;
  textColor?: string;
  order: number;
}
```

#### Database Schema
Following the sponsors pattern, the StreamBanner schema will be embedded in the Tournament document:

```typescript
export const CarouselItemSchema = new Schema({
  text: { type: String, required: true },
  backgroundColor: { type: String, default: "#1f2937" },
  textColor: { type: String, default: "#ffffff" },
  order: { type: Number, default: 0 }
});

export const StreamBannerSchema = new Schema({
  title: { type: String, required: true },
  carouselItems: { type: [CarouselItemSchema], default: [] },
  displayDuration: { type: Number, default: 5 },
  carouselSpeed: { type: Number, default: 50 },
  isActive: { type: Boolean, default: true },
  priority: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
```

### API Endpoints

Following the sponsors REST API pattern:

- `GET /api/v1/tournaments/[tournamentId]/stream-banners` - Get all banners
- `POST /api/v1/tournaments/[tournamentId]/stream-banners` - Create new banner
- `PUT /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId]` - Update banner
- `DELETE /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId]` - Delete banner

### Management Interface Components

#### StreamBannerManager
Main container component that handles:
- State management for banners list
- CRUD operations via API calls
- Form state management
- Modal interactions

#### StreamBannerForm
Form component for creating/editing banners:
- Title input field
- Dynamic carousel items management (add/remove/reorder)
- Display settings (duration, speed)
- Color customization for carousel items
- Real-time preview integration

#### StreamBannerList
List component displaying existing banners:
- Banner cards with title and item count
- Edit/Delete actions
- Active/Inactive status toggle
- Priority ordering controls

#### StreamBannerPreview
Live preview component showing:
- Main title display
- Animated carousel with actual timing
- Real-time updates as form changes
- Same styling as actual overlay

### Display Components

#### StreamBannerDisplay
Main overlay component for OBS:
- Fetches active banners from API
- Handles banner rotation based on priority
- Manages main title and carousel lifecycle
- Responsive design for different stream resolutions

#### MainTitle
Component for the main title area:
- Fade in/out animations
- Configurable display duration
- Typography and styling consistent with tournament branding

#### CarouselTicker
Infinite scrolling carousel component:
- Smooth horizontal scrolling animation
- Seamless loop when reaching end
- Configurable speed and styling
- Individual item styling support

## Data Models

### Form Data Types
```typescript
interface StreamBannerFormData {
  title: string;
  carouselItems: CarouselItemFormData[];
  displayDuration: number;
  carouselSpeed: number;
  isActive: boolean;
  priority: number;
}

interface CarouselItemFormData {
  text: string;
  backgroundColor: string;
  textColor: string;
  order: number;
}
```

### API Response Types
```typescript
interface StreamBannerResponse {
  banners: StreamBanner[];
}

interface CreateStreamBannerResponse {
  banner: StreamBanner;
}
```

## Error Handling

### API Error Handling
Following the sponsors pattern:
- 400 Bad Request for validation errors
- 403 Forbidden for unauthorized access
- 404 Not Found for missing resources
- 500 Internal Server Error for server issues

### Client-Side Error Handling
- Form validation with real-time feedback
- Network error handling with user-friendly messages
- Graceful degradation when preview fails
- Retry mechanisms for failed API calls

### Display Component Error Handling
- Fallback to empty state when no banners available
- Error boundaries to prevent component crashes
- Automatic retry for failed API requests
- Graceful handling of malformed data

## Testing Strategy

### Unit Tests
- Component rendering and prop handling
- Form validation logic
- API utility functions
- Data transformation functions

### Integration Tests
- API endpoint functionality
- Database operations
- Form submission workflows
- Preview component updates

### End-to-End Tests
- Complete banner creation workflow
- Banner editing and deletion
- OBS overlay display functionality
- Multi-banner rotation behavior

### Visual Tests
- Component styling consistency
- Animation smoothness
- Responsive design behavior
- Cross-browser compatibility

## Performance Considerations

### Client-Side Optimization
- Debounced form inputs for preview updates
- Memoized components to prevent unnecessary re-renders
- Efficient carousel animation using CSS transforms
- Lazy loading for banner management interface

### Server-Side Optimization
- Efficient database queries with proper indexing
- Caching for frequently accessed banner data
- Optimized API responses with minimal data transfer
- Rate limiting for API endpoints

### Display Component Optimization
- Smooth 60fps animations using requestAnimationFrame
- Minimal DOM manipulations
- Efficient text measurement for carousel sizing
- Memory leak prevention in long-running overlays

## Security Considerations

### Authentication & Authorization
- Tournament ownership verification for all operations
- Admin override capabilities
- Secure API endpoint access
- Input sanitization for all user data

### Data Validation
- Server-side validation for all inputs
- XSS prevention for user-generated content
- SQL injection prevention (using Mongoose)
- File size limits for any uploaded assets

## Accessibility

### Management Interface
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management in forms and modals

### Display Component
- Appropriate ARIA labels for dynamic content
- Sufficient color contrast ratios
- Readable font sizes and spacing
- Motion reduction support for accessibility preferences