# Copilot Instructions for Synced Shopping List

## Project Overview

This is a Progressive Web App (PWA) for a synchronized shopping list built with React and TypeScript. The app allows multiple users to share and sync shopping lists in real-time while supporting full offline functionality.

## Architecture & Key Patterns

### Technology Stack
- **Frontend**: React 16.13+ with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Backend**: Firebase Realtime Database
- **Storage**: Firebase Storage (for item images)
- **Authentication**: Firebase Auth (external providers only, e.g., Google)
- **Hosting**: Netlify with serverless functions
- **Package Manager**: Yarn
- **Build Tool**: Create React App (CRA) v4

### Key Features
- **Offline-First**: Custom offline support with local storage fallback (Firebase Realtime Database doesn't natively support offline)
- **Real-time Sync**: Changes sync automatically between connected clients
- **PWA**: Service Worker implementation for caching and offline functionality
- **Auto-refresh**: App automatically refreshes when new versions are deployed

### Core Architecture Patterns

#### Offline-First Data Layer
The app uses a custom `Lsbase` service (`src/Services/lsbase.ts`) that wraps Firebase Realtime Database to provide offline capabilities:
- Local storage serves as the primary data source
- Changes queue when offline and sync when reconnected
- Implements event listeners for real-time updates

#### Component Organization
```
src/
├── Components/        # React components organized by feature
├── Services/         # Data layer and external integrations
├── Hooks/           # Custom React hooks
├── Types/           # TypeScript type definitions
├── Styles/          # Shared styling utilities
└── Assets/          # Static assets
```

## Development Setup

### Prerequisites
- Node.js with legacy OpenSSL provider support
- Yarn package manager
- Firebase project configured

### Environment Setup
1. Install dependencies: `yarn`
2. Copy `env.sample` to `.env.local` and configure Firebase credentials
3. Set up Firebase Authentication, Database, and Storage
4. Configure Netlify environment variables for deployment

### Build & Development
- **Development**: `yarn start`
- **Build**: `NODE_OPTIONS="--openssl-legacy-provider" yarn build` (required due to Node.js compatibility with older CRA version)
- **Test**: `yarn test`
- **Local Functions**: `netlify functions:serve` (runs on port 9999)

### Pre-push Hook
The project uses Husky to run `scripts/pre-push.sh` which:
- Runs build validation on master branch
- Automatically bumps version using `npm version minor`
- Can be bypassed with `yarn push:no-version`

## Key Files & Directories

### Core Application
- `src/Components/App/App.tsx` - Main application component with routing
- `src/index.tsx` - Application entry point
- `src/service-worker.ts` - PWA service worker implementation

### Data Layer
- `src/Services/lsbase.ts` - Custom offline-first Firebase wrapper
- `src/Services/db.ts` - Database operations and converters
- `src/Services/firebase.ts` - Firebase configuration and initialization
- `src/Types/entities.ts` - Core data type definitions

### Key Components
- `src/Components/List/` - Main shopping list interface
- `src/Components/Categories/` - Category management
- `src/Components/ServiceWorkerWrapper/` - PWA update handling

### Infrastructure
- `functions/` - Netlify serverless functions (proxy for CORS)
- `scripts/pre-push.sh` - Pre-push validation script
- `netlify.toml` - Netlify deployment configuration

## Data Models

### Core Entities
```typescript
type Item = {
  id: string;
  name: string;
  categoryId?: string | null;
  image?: string | null;
};

type ListItem = {
  id: string;
  itemId: string;
  quantity: number;
  note: string;
  checked: boolean;
  urgency: '1' | '2' | '3';
  addedBy: firebase.User | null;
};

type Category = {
  id: string;
  name: string;
  color?: string;
};
```

## Coding Conventions

### TypeScript
- Strict TypeScript configuration enabled
- Explicit return types preferred for functions
- Use readonly for immutable properties
- Prefer `type` over `interface` for simple structures

### React Patterns
- Functional components with hooks
- Custom hooks for shared logic (see `src/Hooks/`)
- Material-UI's `makeStyles` for component styling
- React Router for navigation

### Styling
- Material-UI theme system
- Shared styles in `src/Styles/common.ts`
- Component-specific styles using `makeStyles`

### File Organization
- Use PascalCase for component directories and files
- Group related components in feature directories
- Export components from index files where appropriate
- Keep services and utilities in separate directories

## Code Practices

### Separation of Concerns
- **Extract business logic from UI components** - Components should focus on rendering, not business logic
- **Use custom hooks for reusable logic** - Create hooks in `src/Hooks/` for shared functionality
- **Keep components clean and focused** - Each component should have a single, clear responsibility
- **Example**: App badge logic extracted to `useAppBadge` hook instead of inline in `App.tsx`

### Custom Hooks Guidelines
- Place all custom hooks in `src/Hooks/` directory
- Name hooks with `use` prefix (e.g., `useAppBadge`, `useDB`)
- Include JSDoc comments explaining the hook's purpose
- Make hooks focused on a single responsibility
- Return only what consumers need
- Include proper TypeScript types for parameters and return values

### Dependency Management
- **Check `packages-list.csv` before adding new dependencies**
- Only use packages that are approved in the package list
- Prefer built-in solutions over external packages when possible
- Document reasons for new dependencies

### Code Quality Standards
- **Maintainability over quick fixes** - Refactor working code if it improves maintainability
- **Professional patterns** - Follow industry best practices and clean code principles
- **Reusability** - Write code that can be easily reused across the application
- **Testability** - Structure code to be easily testable
- **Documentation** - Add comments for complex logic and JSDoc for public APIs

### Feature Implementation Workflow
1. **Understand requirements** - Clarify what needs to be built
2. **Plan architecture** - Decide where logic belongs (component, hook, service)
3. **Implement cleanly** - Write the initial implementation
4. **Refactor if needed** - Separate concerns, extract reusable logic
5. **Test thoroughly** - Verify functionality in different scenarios
6. **Document changes** - Update relevant documentation

### Browser API Usage
- Always check for API availability before using (feature detection)
- Use TypeScript type assertions carefully with browser APIs
- Gracefully degrade when APIs are not supported
- Example: `if ('setAppBadge' in navigator)` before using Badging API


## Database Security

Firebase rules restrict access to specific authenticated email addresses:
```json
{
  "rules": {
    ".read": "auth.token.email == 'authorized@email.com'",
    ".write": "auth.token.email == 'authorized@email.com'"
  }
}
```

## Testing

- Uses React Testing Library and Jest
- Test files follow `*.test.tsx` naming convention
- Focus on testing component behavior and user interactions
- Service layer tests should mock Firebase dependencies

## Deployment Notes

### Netlify Configuration
- Build command: `yarn build` (with legacy OpenSSL provider in production)
- Publish directory: `build`
- Environment variables must match `.env.local` structure
- Functions deploy to `/.netlify/functions/`

### Version Management
- Version bumping is automated via pre-push hook
- Version displays in main navigation
- Use `NO_VERSION=true` environment variable to skip version bump

## Known Issues & Workarounds

1. **Node.js Compatibility**: Requires `NODE_OPTIONS="--openssl-legacy-provider"` for builds due to older CRA version
2. **React Version**: Uses React 16.13 with MUI v5 (peer dependency warnings expected)
3. **Firebase Offline**: Custom `Lsbase` service provides offline support since Firebase Realtime Database doesn't support it natively

## Contributing Guidelines

- Follow existing code structure and patterns
- Ensure offline functionality works for any new features
- Test both online and offline scenarios
- Maintain TypeScript strict compliance
- Update this documentation for significant architectural changes