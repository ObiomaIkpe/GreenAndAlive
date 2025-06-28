# CarbonledgerAI Backend

This is the backend API for the CarbonledgerAI platform, an AI-powered carbon credit management system.

## Features

- **User Authentication** - JWT-based authentication system
- **User Management** - Profile and preferences management
- **Carbon Footprint Tracking** - Calculate and store carbon emissions
- **AI Recommendations** - Generate and manage carbon reduction recommendations
- **AI Usage Metrics** - Track AI service usage and performance

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### User Management

- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `PATCH /api/users/preferences` - Update user preferences

### Carbon Footprint

- `POST /api/carbon/footprint` - Calculate carbon footprint
- `GET /api/carbon/footprint` - Get carbon footprint history
- `GET /api/carbon/footprint/latest` - Get latest carbon footprint

### AI Recommendations

- `POST /api/ai/recommendations` - Generate AI recommendations
- `GET /api/ai/recommendations` - Get AI recommendations
- `PATCH /api/ai/recommendations/:id/implement` - Implement recommendation
- `PATCH /api/ai/recommendations/:id/dismiss` - Dismiss recommendation

### AI Metrics

- `GET /api/ai/metrics` - Get AI usage metrics

## Deployment

This backend is designed to be deployed on Render.com using the included `render.yaml` configuration file.

## License

This project is licensed under the MIT License.