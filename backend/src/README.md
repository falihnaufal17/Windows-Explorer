# MVC Architecture Structure

This backend follows the Model-View-Controller (MVC) architectural pattern for better code organization and maintainability.

## Directory Structure

```
src/
├── config/          # Application configuration
│   └── app.config.ts
├── controllers/     # Request handlers (HTTP layer)
│   └── example.controller.ts
├── middleware/     # Request/response middleware
│   ├── error.middleware.ts
│   └── logger.middleware.ts
├── models/         # Data models and DTOs
│   ├── base.model.ts
│   └── example.model.ts
├── routes/         # Route definitions
│   └── index.ts
├── services/       # Business logic layer
│   └── example.service.ts
├── views/          # Response formatting (presentation layer)
│   └── response.view.ts
└── index.ts        # Application entry point
```

## Architecture Layers

### Models (`models/`)
- Define data structures and interfaces
- Include DTOs (Data Transfer Objects) for request/response validation
- Base models provide common interfaces

### Views (`views/`)
- Handle response formatting and presentation logic
- Ensure consistent API response structure
- Format data for client consumption

### Controllers (`controllers/`)
- Handle HTTP requests and responses
- Validate input data
- Call appropriate services
- Return formatted responses using views
- Handle HTTP status codes

### Services (`services/`)
- Contain business logic
- Interact with data sources (database, external APIs, etc.)
- Perform data manipulation and validation
- Are independent of HTTP concerns

### Routes (`routes/`)
- Define API endpoints
- Map routes to controllers
- Apply route-level middleware if needed

### Middleware (`middleware/`)
- Global request/response processing
- Error handling
- Logging
- Authentication/authorization
- Request validation

### Config (`config/`)
- Application configuration
- Environment variables
- Constants

## Example Usage

The project includes a complete example demonstrating the MVC pattern:

- **Model**: `Example` interface with DTOs
- **Service**: `ExampleService` with CRUD operations
- **Controller**: `ExampleController` handling HTTP requests
- **View**: `ResponseView` formatting responses

### API Endpoints

- `GET /` - API information
- `GET /api/v1/health` - Health check
- `GET /api/v1/examples` - Get all examples
- `GET /api/v1/examples/:id` - Get example by ID
- `POST /api/v1/examples` - Create example
- `PUT /api/v1/examples/:id` - Update example
- `DELETE /api/v1/examples/:id` - Delete example

## Adding New Features

To add a new feature following MVC:

1. **Create Model** (`models/your-feature.model.ts`)
   - Define interfaces and DTOs

2. **Create Service** (`services/your-feature.service.ts`)
   - Implement business logic

3. **Create Controller** (`controllers/your-feature.controller.ts`)
   - Handle HTTP requests
   - Use service and view

4. **Add Routes** (`routes/index.ts`)
   - Register controller routes

## Best Practices

- Keep controllers thin - they should only handle HTTP concerns
- Put business logic in services
- Use models for type safety
- Format responses consistently using views
- Handle errors in middleware
- Keep services independent of HTTP layer

