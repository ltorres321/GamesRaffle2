# Games Raffle API - Backend

This is the Node.js/Express backend API for the Games Raffle application.

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js          # Application configuration
│   │   ├── database.js        # SQL Server connection & helpers
│   │   └── redis.js           # Redis connection & caching
│   ├── middleware/
│   │   ├── errorHandler.js    # Global error handling
│   │   └── notFound.js        # 404 handler
│   ├── routes/
│   │   ├── auth.js            # Authentication endpoints
│   │   ├── users.js           # User management
│   │   ├── games.js           # Game management
│   │   ├── picks.js           # Player picks
│   │   ├── teams.js           # NFL teams
│   │   ├── schedule.js        # NFL schedule
│   │   ├── admin.js           # Admin functions
│   │   └── upload.js          # File uploads
│   ├── utils/
│   │   └── logger.js          # Winston logging
│   └── server.js              # Main application entry point
├── package.json               # Dependencies and scripts
├── .env.example              # Environment variables template
└── README.md                 # This file
```

## Features

- **Express.js** with TypeScript-style error handling
- **SQL Server** integration with connection pooling
- **Redis** caching and session management
- **JWT** authentication with refresh tokens
- **Winston** logging with Application Insights
- **Helmet** security middleware
- **CORS** configuration
- **Rate limiting**
- **File upload** support with Azure Blob Storage
- **Health checks** and monitoring
- **Graceful shutdown** handling

## Prerequisites

- Node.js 18+ and npm 9+
- Azure SQL Server database
- Azure Cache for Redis
- Azure Blob Storage account
- Application Insights (optional)

## Installation

1. Clone the repository and navigate to backend directory
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your Azure resources configuration:
   - SQL_CONNECTION_STRING
   - REDIS_CONNECTION_STRING
   - JWT_SECRET and SESSION_SECRET
   - STORAGE_CONNECTION_STRING
   - ESPN_API_KEY

## Development

Start the development server with hot reload:
```bash
npm run dev
```

The API will be available at `http://localhost:8000`

## Production

Build and start the production server:
```bash
npm start
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## API Endpoints

### Core Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/docs` - API documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/verify` - Submit age verification

### Game Management
- `GET /api/games` - List available games
- `POST /api/games` - Create new game (admin)
- `GET /api/games/:id` - Get game details
- `POST /api/games/:id/join` - Join a game

### Player Picks
- `GET /api/picks/:gameId` - Get user's picks for game
- `POST /api/picks` - Submit picks
- `PUT /api/picks/:id` - Update pick

### NFL Data
- `GET /api/teams` - Get NFL teams
- `GET /api/schedule/:week` - Get NFL schedule by week

### Admin Functions
- `GET /api/admin/games` - Manage all games
- `GET /api/admin/users` - Manage users
- `POST /api/admin/process-scores` - Process game results

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables
- `SQL_CONNECTION_STRING` - Azure SQL Database connection string
- `REDIS_CONNECTION_STRING` - Azure Redis Cache connection string  
- `JWT_SECRET` - JWT signing secret (32+ characters)
- `SESSION_SECRET` - Session secret (32+ characters)

### Optional Variables
- `ESPN_API_KEY` - ESPN API key for schedule data
- `STORAGE_CONNECTION_STRING` - Azure Blob Storage for file uploads
- `APPINSIGHTS_INSTRUMENTATIONKEY` - Application Insights for monitoring

## Database Schema

The database schema is defined in `../database/create-schema.sql`. Run this script after deploying Azure infrastructure.

## Redis Caching

The application uses Redis for:
- User sessions
- ESPN API response caching
- Game data caching
- Temporary pick storage
- Rate limiting

## Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention

## Monitoring

- Application Insights integration
- Winston logging with multiple transports
- Health check endpoint
- Request/response logging
- Performance metrics

## Error Handling

- Global error handler with proper HTTP status codes
- Development vs production error responses
- Structured error logging
- Graceful database and Redis error handling

## Contributing

1. Follow the existing code structure
2. Add proper error handling and logging
3. Write tests for new functionality
4. Update documentation

## License

MIT License