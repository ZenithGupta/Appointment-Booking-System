Updated API Endpoints
After consolidation, all endpoints are now under /api/:
Authentication

POST /api/register/ - User registration
POST /api/login/ - User login
POST /api/logout/ - User logout
GET/PUT /api/profile/ - User profile
POST /api/change-password/ - Change password

Doctors

GET /api/doctors/ - List doctors
GET /api/doctors/{id}/ - Doctor detail
GET /api/doctors/by-specialty/{specialty_id}/ - Doctors by specialty
GET /api/doctors/{doctor_id}/available-slots/ - Available slots
GET /api/specialties/ - List specialties
GET /api/languages/ - List languages
GET /api/schedules/ - Doctor schedules

Patients

GET/POST /api/patient/profile/ - Patient profile management
GET/POST /api/patient/medical-history/ - Medical history management

Appointments

GET /api/appointment/my-appointments/ - User's appointments
POST /api/appointment/book/{doctor_id}/ - Book appointment
POST /api/appointment/cancel/{appointment_id}/ - Cancel appointment

Notes

All functionality remains the same, just consolidated into one app
Admin interface will show all models under the Authentication app
URL structure has been simplified