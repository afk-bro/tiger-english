# Tech Context - Gain English

## Technology Stack

### Frontend Framework
- **React 19.1.0**: Latest React with concurrent features and improved performance
- **TypeScript 5.8.3**: Strict type checking for better code quality and developer experience
- **Vite 6.3.5**: Fast build tool with hot module replacement and optimized bundling

### UI & Styling
- **Tailwind CSS 3.4.17**: Utility-first CSS framework for rapid UI development
- **@tailwindcss/forms 0.5.10**: Enhanced form styling and accessibility
- **@tailwindcss/typography 0.5.16**: Beautiful typography defaults
- **tailwindcss-animate 1.0.7**: Animation utilities for smooth interactions
- **Headless UI 2.2.4**: Unstyled, accessible UI components
- **Lucide React 0.523.0**: Beautiful, customizable SVG icons
- **clsx 2.1.1**: Utility for constructing className strings conditionally

### State Management & Forms
- **Zustand 5.0.6**: Lightweight state management with minimal boilerplate
- **React Hook Form 7.58.1**: Performant forms with easy validation
- **@hookform/resolvers 5.1.1**: Validation resolvers for React Hook Form
- **Zod 3.25.67**: TypeScript-first schema validation

### Backend & Database
- **Supabase 2.50.2**: Backend-as-a-Service with PostgreSQL, authentication, and real-time features
- **PostgreSQL**: Robust relational database with advanced features
- **Row Level Security (RLS)**: Database-level security for multi-tenant data isolation

### Internationalization
- **i18next 25.2.1**: Internationalization framework
- **react-i18next 15.5.3**: React bindings for i18next
- **i18next-browser-languagedetector 8.2.0**: Automatic language detection
- **i18next-http-backend 3.0.2**: Backend plugin for loading translations

### Routing & Navigation
- **React Router DOM 7.6.2**: Declarative routing for React applications

### UI Feedback & Notifications
- **Sonner 2.0.5**: Toast notifications with excellent UX

## Development Tools

### Code Quality & Linting
- **ESLint 9.25.0**: JavaScript/TypeScript linting with modern configuration
- **@eslint/js 9.25.0**: ESLint JavaScript rules
- **typescript-eslint 8.30.1**: TypeScript-specific ESLint rules
- **eslint-plugin-react-hooks 5.2.0**: React Hooks linting rules
- **eslint-plugin-react-refresh 0.4.19**: React Fast Refresh linting

### Testing Framework
- **Vitest 3.2.4**: Fast unit testing framework with Vite integration
- **@vitest/ui 3.2.4**: Web UI for Vitest test runner
- **React Testing Library 16.3.0**: Simple and complete testing utilities
- **@testing-library/jest-dom 6.6.3**: Custom Jest matchers for DOM testing
- **@testing-library/user-event 14.6.1**: User interaction simulation
- **jsdom 26.1.0**: DOM implementation for testing

### Build & Development
- **@vitejs/plugin-react 4.4.1**: Vite plugin for React support
- **PostCSS 8.5.6**: CSS transformation tool
- **Autoprefixer 10.4.21**: Automatic vendor prefixing

## Development Setup

### Prerequisites
```bash
Node.js: 18+ (LTS recommended)
npm: 9+ or yarn: 1.22+
Git: 2.30+
```

### Environment Configuration
```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Analytics (Optional)
VITE_ENABLE_ANALYTICS=true

# Development
NODE_ENV=development
```

### Available Scripts
```json
{
  "dev": "vite",                    // Start development server
  "build": "tsc -b && vite build", // Production build with type checking
  "lint": "eslint .",               // Run ESLint
  "preview": "vite preview",        // Preview production build
  "test": "vitest",                 // Run tests
  "test:watch": "vitest --watch",   // Run tests in watch mode
  "test:ui": "vitest --ui",         // Run tests with web UI
  "test:coverage": "vitest --coverage", // Run tests with coverage
  "type-check": "tsc --noEmit",     // Type checking only
  "format": "prettier --write",     // Format code
  "format:check": "prettier --check" // Check formatting
}
```

## Technical Constraints

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **ES2020+ Features**: Native support required (no IE11 support)
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

### Performance Requirements
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms
- **Bundle Size**: Main bundle < 500KB gzipped

### Security Considerations
- **Content Security Policy**: Strict CSP headers
- **HTTPS Only**: All production traffic encrypted
- **Row Level Security**: Database-level access control
- **Input Validation**: Client and server-side validation
- **XSS Protection**: Sanitized user inputs

## Database Schema

### Core Tables
```sql
-- User profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User statistics and progress
CREATE TABLE user_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  study_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Flashcards (future implementation)
CREATE TABLE flashcards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  difficulty TEXT DEFAULT 'beginner',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Row Level Security Policies
```sql
-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Stats: Users can only access their own stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid() = user_id);
```

## Tool Usage Patterns

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### ESLint Configuration
- React-specific rules for hooks and JSX
- TypeScript integration with type-aware linting
- Import/export organization rules
- Accessibility linting (future addition)

### Vite Configuration
```typescript
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@headlessui/react', 'lucide-react']
        }
      }
    }
  }
});
```

## Development Workflow

### Git Workflow
- **Main Branch**: Production-ready code
- **Feature Branches**: `feat/feature-name`
- **Bug Fixes**: `fix/bug-description`
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`

### Code Review Process
1. Feature branch creation from main
2. Development with regular commits
3. Pull request with description and testing notes
4. Code review focusing on functionality, performance, and maintainability
5. Automated testing and type checking
6. Merge to main after approval

### Testing Strategy
- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: Feature workflows and API interactions
- **E2E Tests**: Critical user journeys (future implementation)
- **Coverage Target**: 80%+ for critical business logic

This technical foundation provides a modern, scalable, and maintainable development environment optimized for the Gain English learning platform.
