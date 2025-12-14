# Windows Explorer

A full-stack file explorer application built with Vue 3 and Elysia, featuring a folder management system with a PostgreSQL database.

## 🚀 Tech Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **TypeScript** - Type-safe JavaScript
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management for Vue
- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing

### Backend
- **Elysia** - Fast and friendly Bun web framework
- **Bun** - All-in-one JavaScript runtime
- **PostgreSQL** - Relational database
- **TypeScript** - Type-safe JavaScript

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Bun** - All-in-one JavaScript runtime and package manager ([Install Bun](https://bun.sh))
- **PostgreSQL** - Database server ([Install PostgreSQL](https://www.postgresql.org/download/))

## 🛠️ Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd windows-explorer
   ```

2. **Install all dependencies:**
   ```bash
   bun run install:all
   ```
   
   This will install:
   - Root dependencies (concurrently)
   - Backend dependencies (using Bun)
   - Frontend dependencies (using Bun)

## ⚙️ Configuration

### Backend Configuration

1. **Create environment file:**
   ```bash
   cd backend
   cp .env.example .env  # If .env.example exists, or create .env manually
   ```

2. **Configure database connection in `.env`:**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/windows_explorer
   PORT=3000
   HOST=0.0.0.0
   NODE_ENV=development
   ```

3. **Create PostgreSQL database:**
   ```bash
   createdb windows_explorer
   # Or using psql:
   # psql -U postgres -c "CREATE DATABASE windows_explorer;"
   ```

4. **Run database migrations:**
   ```bash
   bun run db:migrate
   ```

## 🎯 Running the Project

### Run Both Backend and Frontend (Recommended)

Start both services simultaneously with a single command:

```bash
bun run dev
```

This will start:
- **Backend API** at `http://localhost:3000`
- **Frontend App** at `http://localhost:5173`

The output will be color-coded:
- 🔵 Blue prefix for Backend (BE)
- 🟢 Green prefix for Frontend (FE)

### Run Services Individually

**Backend only:**
```bash
bun run dev:backend
```

**Frontend only:**
```bash
bun run dev:frontend
```

## 📜 Available Scripts

### Development
- `bun run dev` - Run both backend and frontend concurrently
- `bun run dev:backend` - Run backend development server only
- `bun run dev:frontend` - Run frontend development server only

### Building
- `bun run build` - Build both backend and frontend for production
- `bun run build:backend` - Build backend only
- `bun run build:frontend` - Build frontend only

### Testing
- `bun run test` - Run all tests (backend + frontend unit tests)
- `bun run test:backend` - Run backend tests only
- `bun run test:frontend` - Run frontend unit tests only
- `bun run test:e2e` - Run end-to-end tests (Playwright)

### Database
- `bun run db:migrate` - Run all pending database migrations
- `bun run db:migrate:create` - Create a new migration file

### Installation
- `bun run install:all` - Install all dependencies (root, backend, frontend)

## 📁 Project Structure

```
windows-explorer/
├── backend/                 # Backend API (Elysia + Bun)
│   ├── src/
│   │   ├── config/         # Application configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── db/             # Database connection and migrations
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── views/          # Response formatters
│   └── package.json
├── frontend/               # Frontend app (Vue 3 + Vite)
│   ├── src/
│   │   ├── router/         # Vue Router configuration
│   │   ├── stores/         # Pinia stores
│   │   └── App.vue         # Root component
│   └── package.json
└── package.json            # Root package.json (monolith scripts)
```

## 🔌 API Endpoints

The backend API is available at `http://localhost:3000/api/v1`

### Health Check
- `GET /api/v1/health` - Check server health status

### Folders
- `GET /api/v1/folders` - Get all folders (tree structure)
- `GET /api/v1/folders/:id` - Get folder by ID
- `GET /api/v1/folders/:id/children` - Get child folders
- `GET /api/v1/folders/:id/path` - Get folder path
- `GET /api/v1/folders/:id/subfolders` - Get subfolder count
- `POST /api/v1/folders` - Create a new folder
- `PUT /api/v1/folders/:id` - Update folder
- `PATCH /api/v1/folders/:id/expand` - Toggle folder expansion state
- `PATCH /api/v1/folders/:id/move` - Move folder to new parent
- `DELETE /api/v1/folders/:id` - Delete folder

### API Documentation
- Swagger UI available at `http://localhost:3000/swagger` (when server is running)

## 🧪 Testing

### Backend Tests
```bash
bun run test:backend
```

### Frontend Unit Tests
```bash
bun run test:frontend
```

### End-to-End Tests
```bash
# Install Playwright browsers (first time only)
cd frontend
bunx playwright install

# Run E2E tests
bun run test:e2e
```

## 🏗️ Architecture

### Backend
- **MVC Pattern** - Model-View-Controller architecture
- **Service Layer** - Business logic separation
- **Database Migrations** - Version-controlled schema changes
- **Error Middleware** - Centralized error handling
- **Logger Middleware** - Request logging

### Frontend
- **Component-Based** - Vue 3 Composition API
- **State Management** - Pinia stores
- **Routing** - Vue Router for navigation
- **Type Safety** - Full TypeScript support

## 🔧 Development Guidelines

### Backend Development
- Use TypeScript for type safety
- Follow MVC architecture patterns
- Write tests for services
- Use database migrations for schema changes
- Follow RESTful API conventions

### Frontend Development
- Use Vue 3 Composition API
- Keep components small and focused
- Use Pinia for state management
- Write unit tests for components
- Follow Vue style guide

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database_name
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify database credentials in `.env`
- Check if database exists: `psql -l`

### Port Already in Use
- Backend default port: 3000
- Frontend default port: 5173
- Change ports in configuration if needed

### Dependency Issues
- Run `bun run install:all` to reinstall all dependencies
- Clear node_modules and reinstall if needed

## 📄 License

[Add your license here]

## 👥 Contributors

[Add contributors here]

