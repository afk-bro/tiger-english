# Gain English - AI-Powered English Learning Platform

A modern React application designed to help Thai speakers learn English through interactive flashcards, personalized tutoring, and AI-powered learning tools.

## 🌟 Features

- **Interactive Flashcards** - AI-generated vocabulary cards with contextual images and audio
- **Personalized Learning** - Adaptive content based on user progress and preferences
- **Multi-language Support** - English and Thai interface
- **Dark Mode** - Comfortable learning experience in any lighting
- **User Authentication** - Secure registration and login system
- **Progress Tracking** - XP system and study statistics
- **Responsive Design** - Works seamlessly on desktop and mobile

## 🛠 Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS + Headless UI
- **State Management:** Zustand
- **Backend:** Supabase (Auth + Database)
- **Forms:** React Hook Form + Zod validation
- **Testing:** Vitest + React Testing Library
- **Internationalization:** i18next
- **Notifications:** Sonner

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gain-english
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard-specific components
│   ├── flashcards/     # Flashcard components
│   └── ui/            # Base UI components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication logic
│   └── flashcards/    # Flashcard functionality
├── lib/               # Core utilities and configurations
├── pages/             # Route components
├── stores/            # Zustand state stores
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 🏗 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Code Style
- TypeScript with strict mode
- ESLint configuration with React-specific rules
- Prettier formatting (recommended)

### Git Workflow
- Feature branches: `feat/feature-name`
- Bug fixes: `fix/bug-description`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`

## 🔧 Configuration

### Supabase Setup
1. Create a new Supabase project
2. Set up authentication with email/password
3. Create the following tables:
   - `profiles` (user profiles)
   - `user_stats` (learning progress)
   - `flashcards` (flashcard data)

### Database Schema
```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  username TEXT UNIQUE NOT NULL
);

-- User stats table
CREATE TABLE user_stats (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  study_streak INTEGER DEFAULT 0,
  last_login TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Environment Variables for Production
Ensure all required environment variables are set in your deployment platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@gainenglish.com or create an issue in the repository.
