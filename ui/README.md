# Azure Agents CLI - UI

A lightweight React + Tailwind UI for visualizing Azure AI Foundry Agent Service data.

## Quick Start

### Production

Build and serve:

```bash
cd ui
npm run build
npm start
```

Then Ctrl+click on the link provided

## Features

- ✅ **Agents view**: Browse agents with grid and table layouts
- ✅ **Conversations view**: Timeline visualization of conversation events
- ✅ **Responses view**: Response payload inspection with metadata
- ✅ **Persistent settings**: localStorage-based config persistence
- ✅ **Responsive design**: Works on mobile, tablet, and desktop
- ✅ **Live data**: Fetches from Azure AI Foundry Agent Service

## Architecture

- **Vite**: Fast dev server and build tool
- **React**: Declarative UI components
- **Tailwind CSS v3**: Utility-first styling
- **Node.js server**: API proxy and static file serving

## API Endpoints

The Node.js server (`server.js`) provides:

- `GET /api/agents` - Fetch agents from Azure
- `GET /api/examples/conversations` - Load sample conversation data
- `GET /api/examples/response` - Load sample response data

## Configuration

Set your project endpoint in the UI, or via environment:

```bash
export AZA_PROJECT="https://your-project.eastus.projects.azure.com/projects/123/v1"
```

## File Structure

```
ui/
├── index.html              # HTML entry point
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── server.js               # Node.js API server
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component
│   ├── hooks.js           # Custom React hooks
│   ├── utils.js           # Utility functions
│   ├── index.css          # Tailwind imports
│   └── components/
│       ├── Agents.jsx     # Agents view components
│       ├── Conversations.jsx  # Conversations view
│       └── Responses.jsx  # Responses view
├── examples/              # Sample data files
└── dist/                  # Production build output
```
