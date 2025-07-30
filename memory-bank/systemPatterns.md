# System Patterns - Gain English

## Architecture Overview

### High-Level System Design
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Supabase API   │◄──►│   PostgreSQL    │
│   (Frontend)    │    │   (Backend)      │    │   (Database)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│   Vite Build    │    │   Row Level      │
│   (Bundler)     │    │   Security       │
└─────────────────┘    └──────────────────┘
```

### Core Architectural Principles
1. **Feature-Based Organization**: Code organized by business features, not technical layers
2. **Component Composition**: Reusable UI components with clear separation of concerns
3. **Type Safety**: TypeScript strict mode throughout the application
4. **State Management**: Zustand for global state, React Hook Form for form state
5. **Error Boundaries**: Graceful error handling with user-friendly fallbacks

## Project Structure Patterns

### Directory Organization
```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication-specific components
│   ├── dashboard/      # Dashboard-specific components
│   ├── flashcards/     # Flashcard-specific components
│   └── ui/            # Base UI components (buttons, inputs, etc.)
├── features/           # Feature-based business logic
│   ├── auth/          # Authentication logic and hooks
│   ├── flashcards/    # Flashcard functionality
│   └── booking/       # Future booking features
├── lib/               # Core utilities and configurations
├── pages/             # Route components (page-level)
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
├── utils/             # Pure utility functions
├── locales/           # Internationalization files
└── __tests__/         # Test files
```

### Component Architecture Patterns

#### 1. Atomic Design System
```typescript
// Base UI Components (Atoms)
src/components/ui/Button.tsx
src/components/ui/FormInput.tsx
src/components/ui/NavLink.tsx

// Composite Components (Molecules)
src/components/auth/ErrorGuidanceCard.tsx
src/components/flashcards/Flashcard.tsx

// Feature Components (Organisms)
src/components/dashboard/DashboardLayout.tsx
src/components/flashcards/FlashcardViewer.tsx

// Page Components (Templates)
src/pages/Dashboard.tsx
src/pages/Register.tsx
```

#### 2. Feature-Based Hooks Pattern
```typescript
// Custom hooks encapsulate business logic
src/features/auth/useRegisterForm.ts      // Form state management
src/features/auth/useRegisterSubmit.ts    // Form submission logic
src/features/auth/registerUser.ts         // API integration

// Hook composition pattern
const RegisterPage = () => {
  const formHook = useRegisterForm();
  const submitHook = useRegisterSubmit();
  // UI rendering only
};
```

## Key Technical Decisions

### 1. State Management Strategy
- **Global State**: Zustand for user authentication, app settings
- **Server State**: React Query pattern (future implementation)
- **Form State**: React Hook Form with Zod validation
- **Component State**: useState for local UI state

```typescript
// Zustand store pattern
interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### 2. Form Handling Pattern
```typescript
// Zod schema validation
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword);

// React Hook Form integration
const form = useForm<RegisterFormData>({
  resolver: zodResolver(registerSchema),
  mode: 'onChange',
});
```

### 3. Error Handling Strategy
- **Error Boundaries**: Catch React component errors
- **Form Validation**: Real-time validation with user-friendly messages
- **API Errors**: Structured error responses with field-specific mapping
- **Analytics Integration**: Error tracking for debugging and improvement

```typescript
// Error boundary pattern
class ErrorBoundary extends Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Future: Send to error reporting service
  }
}
```

## Component Relationships

### Authentication Flow
```
App.tsx
├── ErrorBoundary
├── Router
    ├── Register.tsx
    │   ├── useRegisterForm() hook
    │   ├── useRegisterSubmit() hook
    │   └── ErrorGuidanceCard component
    ├── Login.tsx
    └── Dashboard.tsx (protected route)
```

### Flashcard System Architecture
```
FlashcardsPage.tsx
├── FlashcardViewer
│   ├── Flashcard component
│   ├── DifficultySelector
│   └── ActionBar
├── FlashcardGrid (list view)
└── AddFlashcardForm (admin/future)
```

## Critical Implementation Paths

### 1. User Registration Flow
```typescript
// Step-by-step registration process
1. Form validation (client-side with Zod)
2. Username availability check (future optimization)
3. Supabase auth user creation
4. Profile record creation
5. User stats initialization
6. Success feedback and navigation
```

### 2. Authentication State Management
```typescript
// Authentication persistence pattern
1. Check for existing session on app load
2. Update Zustand store with user data
3. Protect routes with authentication guards
4. Handle token refresh automatically
5. Clear state on logout
```

### 3. Flashcard Learning Loop
```typescript
// Core learning interaction pattern
1. Load user's current flashcard set
2. Display card with difficulty-appropriate content
3. Capture user interaction (flip, rate difficulty)
4. Update spaced repetition algorithm
5. Track progress and XP gains
6. Schedule next review session
```

## Design Patterns in Use

### 1. Custom Hook Pattern
- Encapsulate complex logic in reusable hooks
- Separate business logic from UI components
- Enable easy testing and composition

### 2. Compound Component Pattern
```typescript
// Flexible component composition
<FlashcardViewer>
  <FlashcardViewer.Card />
  <FlashcardViewer.Controls />
  <FlashcardViewer.Progress />
</FlashcardViewer>
```

### 3. Provider Pattern
```typescript
// Context for feature-specific state
<AuthProvider>
  <ThemeProvider>
    <I18nProvider>
      <App />
    </I18nProvider>
  </ThemeProvider>
</AuthProvider>
```

### 4. Repository Pattern (Future)
```typescript
// Abstract data access layer
interface FlashcardRepository {
  getByUser(userId: string): Promise<Flashcard[]>;
  create(flashcard: CreateFlashcardData): Promise<Flashcard>;
  update(id: string, data: UpdateFlashcardData): Promise<Flashcard>;
}
```

## Performance Optimization Patterns

### 1. Code Splitting
- Route-based code splitting with React.lazy()
- Component-level splitting for heavy features
- Dynamic imports for non-critical functionality

### 2. Memoization Strategy
- React.memo for expensive component renders
- useMemo for expensive calculations
- useCallback for stable function references

### 3. Bundle Optimization
- Tree shaking for unused code elimination
- Asset optimization with Vite
- Progressive loading for images and media

This system architecture provides a scalable foundation that can grow with the application's complexity while maintaining code quality and developer experience.
