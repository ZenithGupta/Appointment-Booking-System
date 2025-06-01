# Doctor Appointment Booking System

A full-stack web application for managing doctor appointments with Django REST API backend and React frontend.

## 🏗️ Project Structure

```
appointment-booking/
├── backend/                 # Django REST API
│   ├── authentication/     # Main Django app
│   ├── backend/            # Django project settings
│   ├── venv/              # Python virtual environment
│   ├── manage.py          # Django management script
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # Backend documentation
├── frontend/              # React application
│   ├── src/              # React source code
│   ├── public/           # Static assets
│   ├── package.json      # Node.js dependencies
│   └── README.md         # Frontend documentation
├── docs/                 # Project documentation
├── .gitignore           # Git ignore rules
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Git

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd appointment-booking
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start backend server
python manage.py runserver
```
**Backend runs at:** `http://localhost:8000`

### 3. Frontend Setup
```bash
# In a new terminal
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start frontend development server
npm run dev
```
**Frontend runs at:** `http://localhost:3000`

## 📋 Features

### Backend API
- **JWT Authentication**: Secure user registration and login
- **Doctor Management**: Profiles with specialties and schedules
- **Appointment System**: Slot-based and range-based booking
- **Patient Management**: Profiles and medical history
- **Admin Interface**: Django admin for data management

### Frontend Application
- **Modern React UI**: Responsive design with Vite
- **User Authentication**: Login/register with JWT
- **Doctor Discovery**: Browse doctors by specialty
- **Appointment Booking**: Interactive booking interface
- **User Dashboard**: Manage appointments and profile

## 🔗 API Endpoints

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - User login (email-based)
- `POST /api/logout/` - User logout
- `GET/PUT /api/profile/` - User profile management

### Doctors & Schedules
- `GET /api/doctors/` - List doctors
- `GET /api/specialties/` - List specialties
- `GET /api/doctors/{id}/available-slots/` - Available slots

### Appointments
- `POST /api/appointment/book/{doctor_id}/` - Book appointment
- `GET /api/appointment/my-appointments/` - User's appointments
- `POST /api/appointment/cancel/{id}/` - Cancel appointment

[📖 **Complete API Documentation**](./backend/README.md)

## 🛠️ Development

### Backend Development
```bash
cd backend

# Activate virtual environment
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run tests
python manage.py test

# Create migrations
python manage.py makemigrations

# Access admin interface
# http://localhost:8000/admin
```

### Frontend Development
```bash
cd frontend

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🚀 Deployment

### Backend (Django)
1. Set environment variables for production
2. Configure production database (PostgreSQL recommended)
3. Set `DEBUG = False` in settings
4. Configure static files serving
5. Deploy to platform (Heroku, DigitalOcean, AWS, etc.)

### Frontend (React)
1. Update `.env` with production API URL
2. Build: `npm run build`
3. Deploy `dist` folder to hosting service
4. Configure routing for SPA (Single Page Application)

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📁 Key Files

### Backend
- `backend/authentication/models.py` - Database models
- `backend/authentication/views.py` - API endpoints
- `backend/authentication/serializers.py` - Data serialization
- `backend/backend/settings.py` - Django configuration

### Frontend
- `frontend/src/App.jsx` - Main React component
- `frontend/src/main.jsx` - Application entry point
- `frontend/vite.config.js` - Build configuration
- `frontend/package.json` - Dependencies and scripts

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📚 Documentation

- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)

## 🐛 Troubleshooting

### Common Issues

1. **Backend server won't start**
   - Ensure virtual environment is activated
   - Check if all dependencies are installed
   - Verify database migrations are up to date

2. **Frontend build fails**
   - Check Node.js version (requires 16+)
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Verify environment variables in `.env`

3. **API connection issues**
   - Ensure backend is running on port 8000
   - Check CORS settings in Django
   - Verify API base URL in frontend `.env`

4. **Authentication not working**
   - Check JWT token expiration
   - Verify email/password are correct
   - Ensure user account is active

## 🏥 About

This Doctor Appointment Booking System provides a complete solution for healthcare providers to manage appointments online. Built with modern technologies and following best practices for security, scalability, and user experience.