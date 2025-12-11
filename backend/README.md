# Backend API - Elysia with PostgreSQL

A backend API built with Elysia, Bun runtime, and PostgreSQL database using MVC architecture.

## Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL installed and running
- A PostgreSQL database created

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and update the database connection details:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/windows_explorer
   ```

3. **Run database migrations:**
   ```bash
   bun run db:migrate
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

The server will be available at `http://localhost:3000`

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run db:migrate` - Run all pending database migrations
- `bun run db:migrate:create <name>` - Create a new migration file

## Project Structure

See `src/README.md` for detailed architecture documentation.

## API Endpoints

- `GET /` - API information
- `GET /api/v1/health` - Health check
- `GET /api/v1/examples` - Get all examples
- `GET /api/v1/examples/:id` - Get example by ID
- `POST /api/v1/examples` - Create example
- `PUT /api/v1/examples/:id` - Update example
- `DELETE /api/v1/examples/:id` - Delete example