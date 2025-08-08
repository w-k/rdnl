# Rodinal Stand Development Calculator

A React-based calculator for determining development times for Rodinal stand development with temperature modeling and fridge cooling simulation.

## Features

- Calculate development times for 1+50 and 1+100 Rodinal dilutions
- Temperature-aware modeling with cooling simulation
- Fridge cooling support with customizable parameters
- Real-time charts showing temperature and development progress
- Risk assessment for different temperature scenarios

## Getting Started

### Prerequisites

- Node.js (version 16.0.0 or higher)
- npm (comes with Node.js)

### Installation

1. Clone or download this repository
2. Navigate to the project directory:
   ```bash
   cd rdnl
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

#### Development Mode
Start the development server with hot reload:
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

#### Production Build
Build the app for production:
```bash
npm run build
```
The built files will be in the `dist/` folder.

#### Preview Production Build
Preview the production build locally:
```bash
npm run preview
```

## Usage

1. Select your Rodinal dilution (1+50 or 1+100)
2. Enter the initial temperature of your developer
3. Toggle "Put tank in fridge" if you plan to cool the developer during development
4. View the calculated development time and risk assessment
5. Monitor the temperature and development progress chart

## Technical Details

- Built with React 19 and Vite
- Styled with Tailwind CSS
- Charts powered by Recharts
- Icons from Lucide React