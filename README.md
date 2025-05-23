# Appointment-Booking-System

## **Authentication Endpoints** (`/api/auth/`)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/auth/register/` | POST | Register a new user account |
| `/api/auth/login/` | POST | Login user and get authentication token |
| `/api/auth/logout/` | POST | Logout user (delete auth token) |
| `/api/auth/profile/` | GET, PUT, PATCH | Get/update user profile information |
| `/api/auth/change-password/` | POST | Change user password |

## **Doctor Endpoints** (`/api/doctor/`)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/doctor/doctors/` | GET | List all doctors |
| `/api/doctor/doctors/{id}/` | GET | Get specific doctor details |
| `/api/doctor/schedules/` | GET, POST | List schedules / Create new schedule (admin only) |
| `/api/doctor/schedules/{id}/` | GET, PUT, PATCH, DELETE | Get/update/delete specific schedule (admin only) |
| `/api/doctor/specialties/` | GET | List all medical specialties |
| `/api/doctor/specialties/{id}/` | GET | Get specific specialty details |
| `/api/doctor/languages/` | GET | List all languages |
| `/api/doctor/languages/{id}/` | GET | Get specific language details |
| `/api/doctor/by-specialty/{specialty_id}/` | GET | Get doctors filtered by specialty |
| `/api/doctor/doctors/{doctor_id}/available-slots/` | GET | Get available appointment slots for a doctor |

## **Patient Endpoints** (`/api/patient/`)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/patient/profile/` | GET, POST, PUT, PATCH, DELETE | Manage patient profile (user's own) |
| `/api/patient/profile/{id}/` | GET, PUT, PATCH, DELETE | Get/update specific patient profile |
| `/api/patient/medical-history/` | GET, POST | List/create medical history records |
| `/api/patient/medical-history/{id}/` | GET, PUT, PATCH, DELETE | Get/update/delete specific medical history |

## **Appointment Endpoints** (`/api/appointment/`)

| Endpoint | Method | Use |
|----------|--------|-----|
| `/api/appointment/my-appointments/` | GET | List user's appointments |
| `/api/appointment/my-appointments/{id}/` | GET | Get specific appointment details |
| `/api/appointment/book/{doctor_id}/` | POST | Book appointment with a doctor |
| `/api/appointment/cancel/{appointment_id}/` | POST | Cancel an existing appointment |

## **Admin Endpoints**

| Endpoint | Method | Use |
|----------|--------|-----|
| `/admin/` | GET, POST | Django admin interface |
| `/api-auth/` | GET, POST | DRF browsable API authentication |

## **Key Features & Permissions:**

**Authentication Required:**
- Most endpoints require authentication except doctor listings, specialties, languages, and available slots

**User-Specific Data:**
- Patients can only see their own profile, medical history, and appointments
- Doctors and schedules are publicly viewable for browsing

**Admin-Only Operations:**
- Creating/updating/deleting doctor schedules
- Full CRUD operations through Django admin

**Special Logic:**
- Booking appointments automatically reduces available slots
- Canceling appointments restores available slots
- Appointment status tracking (scheduled, completed, canceled, no_show)

This appears to be a comprehensive medical appointment booking system with proper authentication, user management, and appointment lifecycle management.
