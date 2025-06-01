# Doctor Appointment Booking System - Frontend

A modern React application for booking doctor appointments with a user-friendly interface.

## 🚀 Features

- **User Authentication**: Register, login, and manage user profiles
- **Doctor Discovery**: Browse doctors by specialty and view detailed profiles
- **Appointment Booking**: Book appointments with flexible time slots
- **Schedule Management**: View and manage your appointments
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🛠️ Technologies Used

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS3** - Styling and animations
- **ESLint** - Code linting

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (version 16 or higher)
- npm or yarn package manager
- Backend API running (see `/backend` directory)

## ⚙️ Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment variables file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
# or
yarn dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
# or
yarn build
```

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```

## 📁 Project Structure

```
frontend/
├── public/
│   ├── vite.svg
│   └── index.html
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── package.json
├── vite.config.js
└── README.md
```

## 🔗 API Integration

The frontend communicates with the Django REST API backend located in `../backend/`. Key endpoints include:

- **Authentication**: `/api/register/`, `/api/login/`, `/api/logout/`
- **Doctors**: `/api/doctors/`, `/api/specialties/`
- **Appointments**: `/api/appointment/book/`, `/api/appointment/my-appointments/`
- **Patient Profile**: `/api/patient/profile/`

**Backend must be running on `http://localhost:8000` for full functionality.**

## 🎨 Key Components

- **AuthContext**: Manages user authentication state
- **DoctorCard**: Displays doctor information
- **AppointmentBooking**: Handles appointment booking flow
- **ScheduleView**: Shows user's appointments
- **ProtectedRoute**: Handles route protection

## 🔧 Development Guidelines

### Code Style
- Follow React best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful component and variable names

### State Management
- Use React Context for global state (authentication)
- Use local state for component-specific data
- Implement proper loading and error states

### API Calls
- Use the centralized API service in `src/services/api.js`
- Implement proper error handling for all API calls
- Use loading states for better UX

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is configured to allow requests from the frontend port
2. **API Connection**: Verify the `VITE_API_BASE_URL` in your `.env` file
3. **Node Version**: Make sure you're using Node.js version 16 or higher

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify the backend API is running and accessible
3. Ensure all dependencies are properly installed

## 🚀 Deployment

### Environment Variables for Production
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Build Commands
```bash
# Create production build
npm run build

# The built files will be in the `dist` directory
```

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request with a clear description

## 📄 License

This project is part of the Doctor Appointment Booking System.