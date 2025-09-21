# Implementation Plan

- [x] 1. Create data models and database schemas
  - Create StreamBanner and CarouselItem TypeScript interfaces in types/tournament.ts
  - Implement CarouselItemSchema and StreamBannerSchema in database schemas
  - Add streamBanners field to TournamentSchema following sponsors pattern
  - _Requirements: 1.1, 4.1, 4.4_

- [x] 2. Implement API routes for stream banner CRUD operations


  - Create GET /api/v1/tournaments/[tournamentId]/stream-banners route to fetch banners
  - Create POST /api/v1/tournaments/[tournamentId]/stream-banners route to add new banners
  - Create PUT /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId] route to update banners
  - Create DELETE /api/v1/tournaments/[tournamentId]/stream-banners/[bannerId] route to delete banners
  - Create GET /api/v1/tournaments/[tournamentId]/stream-banners/display route for OBS overlay data
  - Implement proper authentication, validation, and error handling following sponsors pattern
  - _Requirements: 1.1, 1.3, 1.4, 4.2_
  
- [x] 3. Create form data types and validation utilities
  - Define StreamBannerFormData and CarouselItemFormData interfaces in types/forms.ts
  - Create createDefaultStreamBannerForm utility function
  - Implement form validation functions for banner data
  - Create utility functions for form data conversion and carousel item management
  - _Requirements: 1.2, 4.4, 5.5_

- [ ] 4. Build StreamBannerForm component for creating and editing banners
  - Create StreamBannerForm component with title input field
  - Implement dynamic carousel items management (add/remove/reorder functionality)
  - Add display settings controls (duration, speed, priority)
  - Implement color customization for individual carousel items
  - Add form validation with real-time feedback
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 5.1, 5.3_

- [ ] 5. Create StreamBannerPreview component for live preview
  - Build MainTitle component with fade animations and configurable duration
  - Build CarouselTicker component with smooth infinite scrolling
  - Implement StreamBannerPreview that combines MainTitle and CarouselTicker
  - Add real-time preview updates when form data changes
  - Ensure preview uses same styling as actual overlay
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 6. Implement StreamBannerList component for managing existing banners
  - Create banner cards displaying title, item count, and status
  - Add edit/delete action buttons with confirmation dialogs
  - Implement active/inactive status toggle functionality
  - Add priority ordering controls for banner display sequence
  - _Requirements: 1.1, 1.4, 2.5_

- [ ] 7. Build StreamBannerManager container component
  - Create main container component handling state management for banners list
  - Implement CRUD operations via API calls following sponsors pattern
  - Add form state management for create/edit modes
  - Integrate modal interactions for confirmations and alerts
  - Handle loading states and error handling
  - _Requirements: 1.1, 1.3, 1.4, 4.1_

- [ ] 8. Create stream banner management page
  - Build main page component at /modules/tournaments/[tournamentId]/stream-banners
  - Integrate StreamBannerManager, StreamBannerForm, StreamBannerList, and StreamBannerPreview
  - Add OBSDisplayInfo component for stream overlay URL
  - Implement breadcrumb navigation and page layout following sponsors pattern
  - Add proper loading states and error handling
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.3_

- [ ] 9. Implement StreamBannerDisplay component for OBS overlay
  - Create main overlay component that fetches active banners from API
  - Implement banner rotation logic based on priority and timing
  - Handle main title display lifecycle with proper fade transitions
  - Integrate carousel ticker with smooth infinite scrolling
  - Add responsive design for different stream resolutions
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 10. Create OBS overlay page for stream banners
  - Build dedicated page at /modules/tournaments/[tournamentId]/stream-banners/obs
  - Implement StreamBannerDisplay component integration
  - Add proper error handling for missing or invalid banner data
  - Ensure page works in OBS browser source with transparent background
  - Add automatic refresh functionality for banner updates
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 11. Add navigation integration and tournament card updates
  - Add "Stream Banners" link to tournament card navigation
  - Update tournament navigation menu to include stream banners section
  - Ensure proper active state highlighting for stream banner pages
  - Follow existing navigation patterns from sponsors module
  - _Requirements: 4.3_

- [ ] 12. Implement comprehensive error handling and validation
  - Add client-side form validation with user-friendly error messages
  - Implement API error handling with proper HTTP status codes
  - Add graceful degradation for display component when data is unavailable
  - Implement retry mechanisms for failed API calls
  - Add error boundaries to prevent component crashes
  - _Requirements: 1.5, 2.5, 3.4, 5.5_