# Ludo Game Server

NestJS backend server for the Ludo Game application.

## Installation

```bash
npm install
```

## Running the app

```bash
# development
npm run start:dev

# production mode
npm run start:prod
```

## Test

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=3002
FRONTEND_LOCAL=http://localhost:4200
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=ludo_game
JWT_SECRET=your_jwt_secret
```
