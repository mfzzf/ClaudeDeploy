# React UI Integration Documentation

## Overview

ClaudeDeploy now features a beautiful, modern React-based UI that replaces the old HTML/CSS/JS interface. The new UI provides a seamless experience with animations, real-time updates via WebSocket, and a responsive design.

## Architecture

### Frontend (React)
- **Location**: `/ui-react/`
- **Technology**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Build Output**: `/ui-react/dist/`

### Backend (Node.js + Express)
- **Location**: `/src/ui-server-react.js`
- **Port**: 3456 (default)
- **API Routes**:
  - `GET /api/status` - Server status
  - `GET /api/installations` - Installation history
  - `POST /api/install/local` - Local installation
  - `POST /api/install/remote` - Remote installation
  - `POST /api/generate-config` - Generate configuration
- **WebSocket**: `/ws` - Real-time updates

## Features

### 🎨 Beautiful UI
- Animated gradient backgrounds with floating orbs
- Glassmorphism effects
- Smooth transitions using Framer Motion
- Dark theme with purple/pink gradients
- Responsive design for all devices

### 📡 Real-time Updates
- WebSocket connection for live logs
- Installation progress tracking
- Connection status indicator
- Real-time console output with color coding

### 🚀 Installation Options
- **Local Installation**: Install Claude on the current machine
- **Remote Installation**: Deploy to remote servers via SSH
- **Configuration Generator**: Create API configurations
- **History Tracking**: View past installations and their status

### 🔧 Provider Support
- OpenAI API integration
- UCloud API integration
- Custom provider configuration
- Multiple provider simultaneous support

## Setup Instructions

### Development Mode

1. **Install Dependencies**:
```bash
cd ui-react
npm install
```

2. **Start Development Server**:
```bash
npm run dev
```
This runs the Vite dev server on port 3000.

3. **Start Backend Server** (in another terminal):
```bash
cd ..
node index.js ui
```
This starts the backend on port 3456.

### Production Mode

1. **Build React UI**:
```bash
cd ui-react
npm install
npm run build
```

2. **Run Integrated Server**:
```bash
cd ..
node index.js ui
# or
npm run claudedeploy ui
```

The server will automatically serve the built React app from `/ui-react/dist/`.

## File Structure

```
ClaudeDeploy/
├── ui-react/                    # React UI source
│   ├── src/
│   │   ├── components/
│   │   │   ├── ClaudeDeploy.tsx   # Main dashboard component
│   │   │   └── ui/                # Reusable UI components
│   │   ├── lib/
│   │   │   └── utils.ts          # Utility functions
│   │   ├── App.tsx               # App component
│   │   ├── main.tsx              # Entry point
│   │   └── index.css             # Global styles
│   ├── dist/                     # Built files (generated)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── src/
│   ├── ui-server-react.js       # Express server with API routes
│   ├── cli.js                   # CLI integration
│   └── ...
└── package.json
```

## API Endpoints

### Status Check
```http
GET /api/status
```
Returns server status, version, and platform information.

### Get Installations
```http
GET /api/installations
```
Returns array of installation history.

### Local Installation
```http
POST /api/install/local
Content-Type: application/json

{
  "providers": {
    "openai": {
      "enabled": true,
      "apiKey": "sk-...",
      "url": "https://api.openai.com"
    }
  },
  "registry": "https://registry.npmjs.org",
  "verbose": true
}
```

### Remote Installation
```http
POST /api/install/remote
Content-Type: application/json

{
  "host": "server.example.com",
  "port": 22,
  "username": "root",
  "password": "password",
  "providers": {...},
  "skipConfig": false,
  "userInstall": false,
  "verbose": true
}
```

### Generate Configuration
```http
POST /api/generate-config
Content-Type: application/json

{
  "providers": {
    "openai": {
      "enabled": true,
      "apiKey": "sk-...",
      "url": "https://api.openai.com"
    }
  }
}
```

## WebSocket Events

### Client → Server
No specific events required, connection is automatic.

### Server → Client

#### Connection Established
```json
{
  "type": "connected",
  "message": "Connected to ClaudeDeploy WebSocket"
}
```

#### Log Message
```json
{
  "type": "log",
  "level": "info|success|warning|error",
  "message": "Log message text",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Installation Complete
```json
{
  "type": "installation-complete",
  "status": "success|failed",
  "installation": {
    "id": "12345",
    "type": "local|remote",
    "status": "success|failed",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "error": "Error message (if failed)"
}
```

## Customization

### Changing Colors
Edit `/ui-react/tailwind.config.js` to modify the color scheme.

### Modifying Animations
Edit `/ui-react/src/components/ClaudeDeploy.tsx` and adjust Framer Motion configurations.

### Adding New Features
1. Add new API endpoints in `/src/ui-server-react.js`
2. Create new React components in `/ui-react/src/components/`
3. Update the main dashboard in `/ui-react/src/components/ClaudeDeploy.tsx`

## Deployment

### NPM Package
The React build is included when publishing to NPM:
```bash
cd ui-react
npm run build
cd ..
npm publish
```

### Docker
Create a Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
WORKDIR /app/ui-react
RUN npm ci && npm run build
WORKDIR /app
EXPOSE 3456
CMD ["node", "index.js", "ui"]
```

## Troubleshooting

### React UI not loading
1. Check if build exists: `ls ui-react/dist/`
2. If not, build it: `cd ui-react && npm run build`

### WebSocket connection issues
1. Check if port 3456 is available
2. Ensure no firewall blocking WebSocket connections
3. Check browser console for errors

### API errors
1. Check server logs
2. Verify request format matches API documentation
3. Ensure all required dependencies are installed

## Migration from Old UI

The old HTML/CSS/JS UI files in `/ui/` are no longer used. The new React UI provides all the same functionality with a better user experience:

- ✅ Local installation
- ✅ Remote installation
- ✅ Configuration generation
- ✅ Installation history
- ✅ Real-time console output
- ✅ Provider management
- ✅ WebSocket updates

## Future Enhancements

- [ ] Add authentication for production deployments
- [ ] Implement installation templates
- [ ] Add support for batch deployments
- [ ] Create REST API documentation with Swagger
- [ ] Add unit and integration tests
- [ ] Implement dark/light theme toggle
- [ ] Add internationalization (i18n) support

## License

MIT License - Same as ClaudeDeploy main project
