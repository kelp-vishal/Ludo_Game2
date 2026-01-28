
# Ludo Game Server

NestJS backend with WebSocket support for multiplayer Ludo game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
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

3. Start PostgreSQL database

4. Run server:
```bash
npx nx serve server
```

Server runs on `http://localhost:3002`  
API docs: `http://localhost:3002/api/docs`
