# Cleaner Roster Management System

A comprehensive roster management system for cleaning services built with Next.js frontend and Cloudflare Workers backend.

## 📁 Project Structure

```
cleaner-roster/
├── cleaner-rooster/          # Next.js Frontend Application
└── cleaner-rooster-backend/  # Cloudflare Workers Backend API
```

## 🚀 Features

### Frontend (Next.js)
- **Modern Dashboard**: Clean and intuitive admin interface
- **Calendar Management**: Interactive calendar with shift scheduling
- **Real-time Updates**: Live updates for roster changes
- **Responsive Design**: Mobile-first responsive layout
- **Authentication**: Secure login and session management
- **Staff Management**: Comprehensive staff and team management
- **Client Management**: Client profiles and assignment tracking

### Backend (Cloudflare Workers)
- **High Performance**: Edge-deployed API with global coverage
- **Database**: SQLite with Drizzle ORM
- **Authentication**: JWT-based secure authentication
- **Real-time API**: RESTful API with optimized queries
- **Caching**: Intelligent caching for improved performance
- **Email Integration**: Automated roster email notifications

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15.2.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Calendar**: FullCalendar
- **Authentication**: NextAuth.js
- **State Management**: React Context + Hooks

### Backend
- **Runtime**: Cloudflare Workers
- **Language**: TypeScript
- **Framework**: Hono.js
- **Database**: SQLite (Cloudflare D1)
- **ORM**: Drizzle ORM
- **Authentication**: JWT
- **Validation**: Zod

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Cloudflare Account**: For backend deployment
- **Wrangler CLI**: For Cloudflare Workers management

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone git@github.com:manishmh/cleaner-roster.git
cd cleaner-roster
```

### 2. Frontend Setup
```bash
cd cleaner-rooster
npm install
cp .env.example .env.local
# Configure your environment variables
npm run dev
```

### 3. Backend Setup
```bash
cd ../cleaner-rooster-backend
npm install
# Configure wrangler.toml with your Cloudflare settings
npm run dev
```

## 🔧 Development

### Frontend Commands
```bash
cd cleaner-rooster
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Backend Commands
```bash
cd cleaner-rooster-backend
npm run dev                    # Start local development
npm run deploy                 # Deploy to Cloudflare Workers
npm run db:generate           # Generate database migrations
npm run db:push:local         # Push schema to local database
npm run db:migrate:local      # Apply migrations locally
npm run typecheck             # TypeScript type checking
```

## 📊 Database

The system uses SQLite with Drizzle ORM for data management:

- **Staff**: Employee management and roles
- **Clients**: Client information and preferences  
- **Shifts**: Roster scheduling and assignments
- **Teams**: Team composition and management
- **Locations**: Job site information
- **Users**: Authentication and user profiles

## 🔐 Environment Variables

### Frontend (.env.local)
```bash
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
API_BASE_URL=http://localhost:8787
```

### Backend (wrangler.toml)
```toml
name = "cleaner-rooster-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[env.development]
# Configure your D1 database and KV namespace
```

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd cleaner-rooster
npm run build
# Deploy the .next folder to your hosting provider
```

### Backend (Cloudflare Workers)
```bash
cd cleaner-rooster-backend
npm run deploy
```

## 📱 Calendar Features

- **Optimized Loading**: Smart date range loading for better performance
- **Multiple Views**: Month, week, and day views
- **Drag & Drop**: Intuitive shift scheduling
- **Real-time Updates**: Live calendar synchronization
- **Filter & Search**: Advanced filtering by staff, client, or team
- **Mobile Responsive**: Touch-friendly mobile interface

## 🔧 Performance Optimizations

- **Calendar**: Date-range specific loading (60-70% faster month view)
- **Caching**: 5-minute intelligent cache system
- **Debouncing**: 300ms debounced API calls
- **Bundle Splitting**: Optimized code splitting
- **Edge Deployment**: Global CDN via Cloudflare

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ for efficient roster management** 