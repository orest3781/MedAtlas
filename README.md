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