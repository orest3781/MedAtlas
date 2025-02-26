# MedAtlas - Advanced Tracking, Logistics, and Administration System

<div align="center">
  <img src="public/medatlas-logo.png" alt="MedAtlas Logo" width="200"/>
  <p>Advanced Tracking, Logistics, and Administration System for Medical Document Processing</p>
</div>

## 🌟 Features

- **Kiosk Mode**: Streamlined interface for production staff to check in/out of jobs
- **Barcode Scanning**: Quick and efficient document tracking
- **Real-time Job Tracking**: Monitor active jobs and their status
- **Role-based Access Control**: Secure access management for different user roles
- **Modern UI/UX**: Glass-morphism design with responsive layouts
- **Real-time Updates**: Live job status and employee tracking
- **Robust Error Handling**: Comprehensive error tracking, reporting, and recovery

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser

### Installation

```bash
# Clone the repository
git clone https://github.com/orest3781/MedAtlas.git

# Navigate to project directory
cd MedAtlas

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Setup

Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=MedAtlas
VITE_API_URL=http://localhost:3000
```

## 🔑 Authentication

Default credentials for testing:

- **Kiosk Operator**
  - Username: `kiosk`
  - Password: `medatlas2024`

- **Supervisor**
  - Username: `supervisor`
  - Password: `atlas2024`

## 🏗️ Project Structure

```
src/
├── components/     # Reusable Vue components
├── views/         # Page components
├── stores/        # Pinia stores
├── router/        # Vue Router configuration
├── styles/        # Global styles
└── types/         # TypeScript type definitions
```

## 💻 Development

### Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Error Handling System

MedAtlas implements a comprehensive error handling system across both the Electron main process and the Vue renderer process:

#### Main Process Error Handling

- **Centralized Error Service**: All errors are captured, processed, and logged through the `errorHandler` service.
- **Structured Error Types**: Custom `AppError` class with error codes for better categorization and debugging.
- **Error Codes**: Standardized error codes for database, authentication, IPC, and general errors.
- **Persistent Logging**: Errors are logged to both console and file for later analysis.
- **Global Process Handlers**: Catches uncaught exceptions and unhandled promise rejections.

```javascript
// Example of error handling in the main process
try {
  // Some operation
} catch (error) {
  errorHandler.handleError(error, 'database', { 
    action: 'initialize', 
    connectionString: '(redacted)' 
  })
}
```

#### Renderer Process Error Handling

- **Vue Composable**: `useErrorHandler` composable for consistent error handling across components.
- **IPC Integration**: Errors can be reported to the main process for centralized logging.
- **NotificationSystem**: Visual error notifications with automatic dismissal.
- **Recovery Options**: Graceful recovery options for non-fatal errors.

```typescript
// Example of using the error handler in a Vue component
const { handleError } = useErrorHandler()

const doSomething = async () => {
  try {
    await api.performAction()
  } catch (err) {
    handleError(err, { 
      showNotification: true,
      reportToMain: true
    })
  }
}
```

#### Error Communication

- **IPC Channel**: Dedicated IPC channel for error reporting between processes.
- **Serialization**: Errors are properly serialized when passed between processes.
- **Context Preservation**: Error context is maintained across process boundaries.
- **User Feedback**: Appropriate error messages shown to users based on error severity.

### Coding Standards

- Use TypeScript for type safety
- Follow Vue.js Composition API patterns
- Maintain consistent component structure
- Write meaningful commit messages
- Document complex logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Adding tests
- chore: Maintenance

## 📅 Development Schedule

- Daily commits required
- Code reviews every Friday
- Weekly progress updates
- Monthly feature releases

## 📝 License

Copyright © 2024 MedAtlas. All rights reserved.

## 📞 Support

For support, email support@medatlas.com or join our Slack channel.

# MedAtlas Dashboard

A modern medical document processing dashboard built with Vue 3 and TypeScript.

## Features

### Check-In System
- Interactive check-in card with animated barcode
- Two-step scanning process (Employee Badge → Shipment Barcode)
- Visual feedback with glowing border animation
- Test mode support with sample IDs

### Real-Time Status Cards

#### Total Active Jobs
- Live count of jobs currently in the system
- Visual indicator showing system capacity
- Updates automatically when jobs are added or completed

#### Average Processing Time
- Calculates mean time from job start to completion
- Clock-style icon with real-time updates
- Helps identify processing bottlenecks

#### Completed Jobs Today
- Daily completion counter
- Green status indicator for completed work
- Resets at midnight local time

#### Queue Status System
The queue status dynamically changes based on several factors:

1. **Optimal** (Green)
   - No delayed jobs
   - Less than 5 total jobs
   - All processes running smoothly
   - Indicated by balanced status bars

2. **Busy** (Sky Blue)
   - No delayed jobs
   - 5 or more total jobs
   - System at high capacity but maintaining pace
   - Indicated by full utilization bars

3. **Delayed** (Yellow)
   - Less than 30% of jobs delayed
   - Some jobs exceeding time thresholds
   - Warning state indicating attention needed
   - Indicated by reduced capacity bars

4. **Backlogged** (Red)
   - More than 30% of jobs delayed
   - System under stress
   - Immediate attention required
   - Indicated by minimal capacity bars

### Job Management
- Grid view of active jobs
- Progress tracking across multiple stages:
  - PREP
  - SCAN
  - QC
  - INDEX
  - REPREP
- Color-coded status indicators
- Operator assignment tracking
- Time-based alerts for delays

### Visual Indicators
- Color-coded status badges
- Progress bars for each processing stage
- Time-based border colors
- Hover effects for interactive elements
- Animated transitions

## Technical Details

### Queue Status Calculation
```typescript
const queueStatus = computed(() => {
  // Count jobs with delays (>2 hours)
  const delayedJobs = currentJobs.value.filter(job => {
    const stepData = job.steps[job.currentStep]
    if (!stepData.lastUpdated) return false
    
    const now = new Date()
    const lastUpdated = new Date(stepData.lastUpdated)
    const hoursElapsed = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)
    
    return hoursElapsed > 2
  })

  // Calculate health metrics
  const totalJobs = currentJobs.value.length
  const delayedCount = delayedJobs.length
  const delayRatio = delayedCount / (totalJobs || 1)

  // Determine status
  if (delayRatio === 0 && totalJobs < 5) return { text: 'Optimal', color: 'green' }
  if (delayRatio === 0) return { text: 'Busy', color: 'sky' }
  if (delayRatio < 0.3) return { text: 'Delayed', color: 'yellow' }
  return { text: 'Backlogged', color: 'red' }
})
```

### Time Calculations
- Jobs are considered delayed after 2 hours without updates
- Status updates occur in real-time
- Time displays use local timezone
- Elapsed time shown in hours and minutes

## Development

### Prerequisites
- Node.js 16+
- Vue 3
- TypeScript
- Tailwind CSS

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Building
```bash
npm run build
```

### Testing
```bash
npm run test
```

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request 