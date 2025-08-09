# ClaudeDeploy React UI

A beautiful, modern React-based interface for ClaudeDeploy with animations and glassmorphism effects.

## 🚀 Quick Start

### Installation

```bash
# Navigate to the ui-react directory
cd ui-react

# Install dependencies
npm install

# Set the backend UI server port for proxy (default 3456)
# If your backend runs on a different port, set CLAUDEDEPLOY_PORT
export CLAUDEDEPLOY_PORT=3456

# Start development server
npm run dev
```

The UI will be available at http://localhost:3000

Make sure the backend UI server is running, for example:

```bash
cd ..
node index.js ui --port 3456
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## ✨ Features

- **Beautiful Animations**: Smooth transitions and animated backgrounds using Framer Motion
- **Modern Design**: Glassmorphism effects, gradients, and dark theme
- **Real-time Updates**: WebSocket connection for live console output
- **Responsive Layout**: Works on desktop and mobile devices
- **Provider Management**: Easy configuration for OpenAI, UCloud, and custom providers
- **Installation History**: Track all your deployments

## 🎨 UI Components

- Animated header with gradient text
- Tab-based navigation
- Provider selection cards
- Real-time console output
- Progress indicators
- Status badges
- Form inputs with validation

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **Framer Motion** - Animation library
- **Radix UI** - Headless UI components
- **Vite** - Build tool

## 📁 Project Structure

```
ui-react/
├── src/
│   ├── components/
│   │   ├── ClaudeDeploy.tsx    # Main dashboard component
│   │   └── ui/                 # Reusable UI components
│   ├── lib/
│   │   └── utils.ts            # Utility functions
│   ├── App.tsx                 # App component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Configuration

The UI connects to the ClaudeDeploy backend server via `/api` and WebSocket `/ws`. In development, Vite proxies to the backend using `CLAUDEDEPLOY_PORT` (default 3456). Ensure the port matches your backend.

## 🎯 Usage

1. **Local Installation**: Configure providers and install Claude locally
2. **Remote Installation**: Deploy to remote servers via SSH
3. **Configuration**: Set up API keys, models, and parameters
4. **History**: View past installations and their status

## 🌈 Customization

You can customize the UI by:
- Modifying colors in `tailwind.config.js`
- Adjusting animations in `ClaudeDeploy.tsx`
- Creating new components in `src/components/ui/`
- Updating styles in `index.css`

## 📝 License

Part of the ClaudeDeploy project.
