# SignalBoard Frontend

The frontend application for SignalBoard - a futuristic, event-driven trading platform that helps traders anticipate and act on stock price catalysts.

## 🚀 Tech Stack

- **Framework**: Next.js 15.3.3 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 with Glass Morphism design system
- **State Management**: React Context + Custom Hooks
- **Backend**: Supabase (Auth, Database, Realtime)
- **Animations**: Framer Motion
- **Visualization**: D3.js
- **Testing**: Jest + React Testing Library

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- API keys for data sources (see API_KEYS_SETUP.md)

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn (optional)
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Current test coverage target: 80%

## 🔍 Linting

```bash
# Run ESLint
npm run lint
```

ESLint is configured with Next.js recommended rules.

## 🏗️ Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── catalyst/    # Catalyst-related components
│   │   ├── Timeline/    # Timeline visualization
│   │   └── ui/          # Reusable UI components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── lib/            # Utility libraries
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── public/             # Static assets
└── __tests__/         # Test files
```

## 🎨 Design System

We use a Glass Morphism design system with:
- Blur effects and transparency
- Purple/pink gradient accents
- Dark theme optimized
- Responsive design for all devices

Key UI components:
- `GlassCard` - Base glass morphism container
- `GlassButton` - Interactive glass buttons
- `NotificationToast` - Toast notifications
- `DisclaimerBanner` - Compliance disclaimers
- `ErrorBoundary` - Error handling wrapper

## 🔐 Authentication

Authentication is handled via Supabase Auth with:
- Email/password authentication
- Session management with auto-refresh
- Role-based access (trader, admin, guest)
- Rate limiting and CSRF protection

## 📊 Key Features

1. **Catalyst Timeline**
   - Real-time updates via WebSocket
   - Interactive zoom/pan functionality
   - Filter by type, ticker, impact
   - Export to JSON

2. **ML Predictions**
   - Impact score visualization
   - Confidence indicators
   - Historical comparisons

3. **Watchlist**
   - Personal ticker tracking
   - Real-time notifications

4. **Search & Filters**
   - Fuzzy search implementation
   - Multi-criteria filtering
   - Date range selection

## 🚀 Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

For Vercel deployment:
1. Connect your GitHub repository
2. Set environment variables in Vercel dashboard
3. Deploy with automatic builds on push

## 🐛 Debugging

1. **React DevTools**: Install browser extension for component inspection
2. **Redux DevTools**: Monitor state changes (if using Redux)
3. **Network Tab**: Check Supabase API calls
4. **Console Logs**: Development build includes helpful logs

Common issues:
- **CORS errors**: Check Supabase project settings
- **Auth errors**: Verify environment variables
- **Real-time not working**: Check Supabase quotas

## 📚 Documentation

- [Main Project README](../README.md)
- [API Keys Setup](../API_KEYS_SETUP.md)
- [Supabase Implementation](../SUPABASE_IMPLEMENTATION.md)
- [Timeline Component](./src/components/Timeline/README.md)
- [Development Guidelines](../CLAUDE.md)

## 🤝 Contributing

1. Create feature branch from `main`
2. Follow ESLint and TypeScript rules
3. Write tests for new features
4. Update documentation as needed
5. Submit PR with clear description

## 📄 License

This project is proprietary and confidential.