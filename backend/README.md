# CarbonAI Backend

NestJS backend for the CarbonAI platform - AI-Powered Carbon Credit Management System.

## Features

- **Authentication & Authorization** - JWT-based auth with role-based access
- **Carbon Footprint Tracking** - Calculate and track carbon emissions
- **AI Integration** - OpenAI-powered recommendations and predictions
- **Marketplace** - Carbon credit trading and management
- **Blockchain Integration** - Smart contract interactions and transaction tracking
- **Verification System** - Third-party verification workflows
- **Corporate Compliance** - Enterprise carbon management
- **Waste Tracking** - Waste disposal rewards system
- **Analytics** - Comprehensive data analytics and reporting

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with Passport
- **AI**: OpenAI GPT-4 integration
- **Blockchain**: Ethers.js for Ethereum interaction
- **Documentation**: Swagger/OpenAPI
- **Validation**: Class-validator
- **Caching**: Redis-compatible cache manager
- **Rate Limiting**: Built-in throttling

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis (optional, for caching)

### Installation

1. **Install dependencies**
```bash
cd backend
npm install
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Create PostgreSQL database
createdb carbonai_db

# The app will auto-sync tables in development
```

4. **Start Development Server**
```bash
npm run start:dev
```

The API will be available at `http://localhost:3001`
API Documentation: `http://localhost:3001/api/docs`

## Environment Variables

### Required
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=carbonai
DATABASE_PASSWORD=your_password
DATABASE_NAME=carbonai_db
JWT_SECRET=your-super-secret-jwt-key
```

### Optional
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
CORS_ORIGIN=http://localhost:3000
PORT=3001
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get current user profile

### Carbon Tracking
- `POST /api/v1/carbon/footprint` - Create carbon footprint calculation
- `GET /api/v1/carbon/footprint` - Get user's carbon footprint history
- `GET /api/v1/carbon/footprint/latest` - Get latest calculation
- `GET /api/v1/carbon/footprint/trend` - Get monthly trend data

### Marketplace
- `GET /api/v1/marketplace/credits` - Browse carbon credits
- `POST /api/v1/marketplace/purchase` - Purchase carbon credits
- `GET /api/v1/marketplace/purchases` - Get purchase history
- `GET /api/v1/marketplace/stats` - Get marketplace statistics

### AI Services
- `POST /api/v1/ai/recommendations` - Generate AI recommendations
- `GET /api/v1/ai/recommendations` - Get user recommendations
- `POST /api/v1/ai/predict-emissions` - Predict future emissions
- `POST /api/v1/ai/analyze-behavior` - Analyze user behavior

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PATCH /api/v1/users/profile` - Update user profile
- `PATCH /api/v1/users/preferences` - Update user preferences
- `GET /api/v1/users/stats` - Get user statistics

### Analytics
- `GET /api/v1/analytics/user` - Get user analytics
- `GET /api/v1/analytics/platform` - Get platform analytics

## Database Schema

### Core Entities

- **Users** - User accounts and profiles
- **UserPreferences** - User settings and preferences
- **CarbonFootprint** - Carbon emission calculations
- **CarbonCredit** - Marketplace carbon credits
- **Purchase** - Credit purchase transactions
- **AiRecommendation** - AI-generated recommendations
- **BlockchainTransaction** - Blockchain transaction records
- **VerificationRequest** - Third-party verification requests
- **CorporateProfile** - Corporate compliance profiles
- **WasteDisposal** - Waste disposal tracking

## Development

### Running Tests
```bash
npm run test
npm run test:e2e
npm run test:cov
```

### Code Quality
```bash
npm run lint
npm run format
```

### Building for Production
```bash
npm run build
npm run start:prod
```

## API Documentation

Interactive API documentation is available at `/api/docs` when the server is running.

The API follows RESTful conventions and includes:
- Request/response schemas
- Authentication requirements
- Error response formats
- Example requests and responses

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `429` - Too Many Requests
- `500` - Internal Server Error

Error responses include:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent API abuse
- **Input Validation** - Comprehensive request validation
- **CORS Protection** - Configurable cross-origin policies
- **Password Hashing** - Bcrypt password security
- **SQL Injection Protection** - TypeORM query builder safety

## Deployment

### Docker (Recommended)
```bash
# Build image
docker build -t carbonai-backend .

# Run with docker-compose
docker-compose up -d
```

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for your domain
5. Set up SSL/TLS termination
6. Configure process manager (PM2)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.