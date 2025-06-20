# API Structure Documentation

## Overview
The API structure now mirrors the tools organization with versioning for better maintainability and scalability.

## Current API Structure

```
/api/v1/
├── cameras/
│   ├── teams/           POST - Save team configurations
│   └── upload/          POST - Upload team/player images
├── stream/
│   └── players/         GET  - Retrieve all players for streaming
└── champions/
    └── data/            GET/POST - Champion draft data (placeholder)
```

## API Endpoints

### Cameras Tool (`/api/v1/cameras/`)

#### POST `/api/v1/cameras/teams`
- **Purpose**: Save team configurations
- **Body**: Array of team objects with players
- **Response**: `{ success: boolean }`

#### POST `/api/v1/cameras/upload`
- **Purpose**: Upload team logos and player images
- **Body**: FormData with file, type, and indices
- **Response**: `{ path: string }`

### Stream Tool (`/api/v1/stream/`)

#### GET `/api/v1/stream/players`
- **Purpose**: Get all players for streaming interface
- **Response**: Array of player objects with name, url, imagePath

### Champions Tool (`/api/v1/champions/`)

#### GET/POST `/api/v1/champions`
- **Purpose**: Placeholder for future champion draft features
- **Future Features**:
  - Draft picks storage
  - Champion bans
  - Team compositions
  - Pick order tracking

## Migration from Old APIs

| Old API | New API | Status |
|---------|---------|---------|
| `/api/saveTeams` | `/api/v1/cameras/teams` | ✅ Migrated |
| `/api/upload` | `/api/v1/cameras/upload` | ✅ Migrated |
| `/api/players` | `/api/v1/stream/players` | ✅ Migrated |

## Benefits

1. **Versioned APIs**: Easy to maintain backward compatibility
2. **Organized Structure**: APIs grouped by functionality
3. **Scalable**: Easy to add new tools and endpoints
4. **Consistent**: Mirrors the frontend tools structure
5. **Future-Proof**: Room for additional features and versions 