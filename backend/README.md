# Doctor Appointment Booking - Backend API

Django REST API backend for the Doctor Appointment Booking System with JWT authentication and comprehensive appointment management.

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Create virtual environment**
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Database setup**
```bash
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser
```

5. **Start development server**
```bash
python manage.py runserver
```

**API available at:** `http://localhost:8000`

## 📋 Features

- **JWT Authentication**: Secure token-based authentication
- **Email Login**: Users can login with email instead of username
- **Doctor Management**: Complete doctor profiles with specialties
- **Flexible Scheduling**: Slot-based and range-based appointments
- **Patient Management**: Patient profiles and medical history
- **Admin Interface**: Django admin for easy data management
- **API Documentation**: Browsable API with Django REST Framework

## 🗃️ Database Models

### Core Models
- **User**: Django's built-in user model (extended)
- **Doctor**: Doctor profiles with specialties and experience
- **Patient**: Patient information and emergency contacts
- **Specialty**: Medical specialties (Cardiology, Neurology, etc.)
- **Language**: Languages spoken by doctors

### Scheduling Models
- **DoctorSchedule**: Doctor availability with flexible booking types
- **TimeSlot**: Individual time slots for slot-based appointments
- **Appointment**: Appointment bookings with status tracking
- **MedicalHistory**: Patient medical history records

## 🔗 API Endpoints

### Authentication
```
POST   /api/register/                    # User registration
POST   /api/login/                       # Email-based login
POST   /api/logout/                      # User logout
POST   /api/token/refresh/               # Refresh JWT token
GET    /api/profile/                     # Get user profile
PUT    /api/profile/                     # Update user profile
POST   /api/change-password/             # Change password
```

### Doctors & Specialties
```
GET    /api/doctors/                     # List all doctors
POST   /api/doctors/                     # Create doctor (admin)
GET    /api/doctors/{id}/                # Doctor details
GET    /api/doctors/by-specialty/{id}/   # Doctors by specialty
GET    /api/doctors/{id}/available-slots/ # Available appointment slots

GET    /api/specialties/                 # List specialties
POST   /api/specialties/                 # Create specialty (admin)

GET    /api/languages/                   # List languages
POST   /api/languages/                   # Create language (admin)
```

### Schedules
```
GET    /api/schedules/                   # List doctor schedules
POST   /api/schedules/                   # Create schedule (admin)
GET    /api/schedules/{id}/              # Schedule details
```

### Patient Management
```
GET    /api/patient/profile/             # Patient profile
POST   /api/patient/profile/             # Create patient profile
PUT    /api/patient/profile/{id}/        # Update patient profile

GET    /api/patient/medical-history/     # Medical history
POST   /api/patient/medical-history/     # Add medical record
```

### Appointments
```
GET    /api/appointment/my-appointments/ # User's appointments
POST   /api/appointment/book/{doctor_id}/ # Book appointment
POST   /api/appointment/cancel/{id}/     # Cancel appointment
```

## 🔐 Authentication

### Registration
```json
POST /api/register/
{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
}
```

### Login (Email-based)
```json
POST /api/login/
{
    "email": "john@example.com",
    "password": "securepassword"
}

Response:
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user_id": 1,
    "email": "john@example.com",
    "username": "johndoe"
}
```

### Using Authentication
Include JWT token in request headers:
```
Authorization: Bearer <access_token>
```

## 📅 Appointment Booking

### Slot-Based Booking
For doctors with specific time slots:

```json
POST /api/appointment/book/{doctor_id}/
{
    "schedule_id": 1,
    "time_slot_id": 3,
    "notes": "Regular checkup"
}
```

### Range-Based Booking
For doctors with flexible timing:

```json
POST /api/appointment/book/{doctor_id}/
{
    "schedule_id": 1,
    "start_time": "14:00",
    "end_time": "14:30",
    "notes": "Follow-up appointment"
}
```

## 🛠️ Development

### Project Structure
```
backend/
├── authentication/        # Main Django app
│   ├── models.py         # Database models
│   ├── views.py          # API endpoints
│   ├── serializers.py    # Data serialization
│   ├── urls.py          # URL routing
│   └── admin.py         # Django admin config
├── backend/             # Django project settings
│   ├── settings.py      # Main configuration
│   ├── urls.py         # Root URL routing
│   └── wsgi.py         # WSGI configuration
├── manage.py           # Django management script
└── requirements.txt    # Python dependencies
```

### Adding New Features

1. **Create models** in `authentication/models.py`
2. **Create serializers** in `authentication/serializers.py`
3. **Create views** in `authentication/views.py`
4. **Add URLs** in `authentication/urls.py`
5. **Run migrations**:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Running Tests
```bash
python manage.py test
```

### Django Admin
Access Django admin at `http://localhost:8000/admin/`
- Create specialties, languages, and doctors
- View and manage appointments
- Monitor system data

## ⚙️ Configuration

### Environment Variables
Create `.env` file in backend directory:
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3

# JWT Settings
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=10080

# CORS Settings  
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Production Settings
For production deployment:
- Set `DEBUG = False`
- Use PostgreSQL instead of SQLite
- Configure proper `ALLOWED_HOSTS`
- Set up static file serving
- Use environment variables for secrets

## 📊 API Testing

### Using Django REST Framework Browsable API
Visit `http://localhost:8000/api/` in your browser for interactive API testing.

### Using cURL
```bash
# Register user
curl -X POST http://localhost:8000/api/register/ \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"testpass123"}'

# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# List doctors
curl -X GET http://localhost:8000/api/doctors/
```

## 🔧 Troubleshooting

### Common Issues

1. **Virtual environment not activated**
   ```bash
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

2. **Missing dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database errors**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **CORS errors**
   - Check `CORS_ALLOWED_ORIGINS` in settings
   - Ensure frontend URL is included

5. **JWT token expired**
   - Use refresh token to get new access token
   - Check token expiration settings

## 📚 Technologies Used

- **Django 5.2**: Web framework
- **Django REST Framework**: API framework
- **Simple JWT**: JWT authentication
- **Django CORS Headers**: Cross-origin requests
- **SQLite**: Development database
- **Pillow**: Image processing

## 🤝 Contributing

1. Follow Django coding standards
2. Write tests for new features
3. Update API documentation
4. Use proper error handling
5. Follow RESTful API conventions

## 📝 API Response Format

### Success Response
```json
{
    "data": {...},
    "message": "Success message"
}
```

### Error Response
```json
{
    "error": "Error message",
    "details": {...}
}
```

### Validation Errors
```json
{
    "field_name": ["Error message for this field"],
    "another_field": ["Another error message"]
}
```