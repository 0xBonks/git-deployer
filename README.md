# Git Deployer

A web application that generates deployment instructions for Git repositories on various platforms. The application consists of a Python FastAPI backend and a Next.js React frontend.

## Features

- Select from multiple deployment platforms
- Generate platform-specific deployment instructions
- Preview generated Markdown instructions
- Download individual or all deployment guides

## Prerequisites

- Python 3.8+ with pip
- Node.js 18+ with npm or pnpm
- Git

## Setup and Installation

### Backend

1. Install Python dependencies:
   ```bash
   pip install fastapi uvicorn pydantic httpx openai python-dotenv
   ```

2. Create a `.env` file in the root directory with your API credentials:
   ```
   GPT_USERNAME=your_username
   GPT_PASSWORD=your_password
   ```

3. Run the backend server:
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:8000

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   The frontend will run on http://localhost:3000

## Usage

1. Open your browser and navigate to http://localhost:3000
2. Enter a Git repository URL
3. Select one or more deployment platforms
4. Click "Generate Deployment Instructions"
5. Preview and download the generated instructions

## API Endpoints

- `GET /platforms` - Returns available deployment platforms
- `POST /generate_deployment` - Generates deployment instructions based on the provided Git link and platform

## Troubleshooting

- If you encounter CORS issues, ensure the backend CORS middleware is properly configured
- Check the console for any error messages if the application is not functioning correctly 