# Rodinal Stand Development Calculator

A calculator for determining adjusted development times for Rodinal stand development, with temperature modeling and optional fridge cooling simulation.

## Features

- Preset dilutions (1+50 / 1+100) or custom baseline times
- Temperature-adjusted development times using an exponential rate model
- Fridge cooling simulation using Newton's law of cooling
- Real-time chart showing temperature decay and 20°C-equivalent development progress
- Risk assessment for your temperature and dilution combination
- Temperature units: °C, °F, K
- Dark mode
- Export results as a PNG image

## Usage

1. **Set baseline time** — pick a preset dilution (1+50 = 30 min, 1+100 = 60 min) or type any custom time in minutes
2. **Enter your developer temperature** — switch units with the °C / °F / K toggle in the header
3. **Optionally enable fridge cooling** — models the tank cooling toward 4°C with a 30-minute time constant
4. **Read the result** — the calculated development time, average and final temperatures, and a risk badge are shown immediately
5. **Export** — click the Export button to save the result card as a PNG

## Getting Started

### Prerequisites

- Node.js 16+

### Scripts

```bash
npm install          # install dependencies
npm run dev          # start Vite dev server with hot reload
npm run build        # production build to dist/
npm run preview      # serve the production build locally
```

## Analytics

Privacy-friendly analytics via [Plausible](https://plausible.io). The following custom events are tracked:

| Event | Trigger | Props |
|---|---|---|
| `Temperature Changed` | User changes the temperature input | `value`, `unit` |
| `Time Changed` | User changes the baseline time input | `value` |
| `Unit Changed` | User switches temperature unit (°C/°F/K) | `unit` |
| `Export Clicked` | User presses the Export button | `temperature`, `unit`, `time` |

Each event must have a matching [custom event goal](https://plausible.io/docs/custom-event-goals) created in the Plausible dashboard to appear in reports.

## Tech Stack

- React 19 / Vite
- Tailwind CSS
- Recharts
- Lucide React
- html-to-image
