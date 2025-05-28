# Complete API Endpoints List

## 🔐 **Authentication Endpoints**

| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `POST` | `/api/register/` | User registration | Public |
| `POST` | `/api/login/` | User login (JWT) | Public |
| `POST` | `/api/logout/` | User logout | Authenticated |
| `POST` | `/api/token/refresh/` | Refresh JWT token | Public |
| `GET` | `/api/profile/` | Get user profile | Authenticated |
| `PUT` | `/api/profile/` | Update user profile | Authenticated |
| `PATCH` | `/api/profile/` | Partial update user profile | Authenticated |
| `POST` | `/api/change-password/` | Change password | Authenticated |

---

## 🩺 **Doctor Management Endpoints**

### **Specialties**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/specialties/` | List all specialties | Public |
| `POST` | `/api/specialties/` | Create new specialty | Authenticated |
| `GET` | `/api/specialties/{id}/` | Get specialty details | Public |
| `PUT` | `/api/specialties/{id}/` | Update specialty | Authenticated |
| `PATCH` | `/api/specialties/{id}/` | Partial update specialty | Authenticated |
| `DELETE` | `/api/specialties/{id}/` | Delete specialty | Authenticated |

### **Languages**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/languages/` | List all languages | Public |
| `POST` | `/api/languages/` | Create new language | Authenticated |
| `GET` | `/api/languages/{id}/` | Get language details | Public |
| `PUT` | `/api/languages/{id}/` | Update language | Authenticated |
| `PATCH` | `/api/languages/{id}/` | Partial update language | Authenticated |
| `DELETE` | `/api/languages/{id}/` | Delete language | Authenticated |

### **Doctors**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/doctors/` | List all doctors | Public |
| `POST` | `/api/doctors/` | Create new doctor | Authenticated |
| `GET` | `/api/doctors/{id}/` | Get doctor details | Public |
| `PUT` | `/api/doctors/{id}/` | Update doctor | Authenticated |
| `PATCH` | `/api/doctors/{id}/` | Partial update doctor | Authenticated |
| `DELETE` | `/api/doctors/{id}/` | Delete doctor | Authenticated |
| `GET` | `/api/doctors/by-specialty/{specialty_id}/` | Get doctors by specialty | Public |
| `GET` | `/api/doctors/{doctor_id}/available-slots/` | Get doctor's available slots | Public |

### **Doctor Schedules**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/schedules/` | List all schedules | Public |
| `POST` | `/api/schedules/` | Create new schedule | Authenticated |
| `GET` | `/api/schedules/{id}/` | Get schedule details | Public |
| `PUT` | `/api/schedules/{id}/` | Update schedule | Authenticated |
| `PATCH` | `/api/schedules/{id}/` | Partial update schedule | Authenticated |
| `DELETE` | `/api/schedules/{id}/` | Delete schedule | Authenticated |
| `GET` | `/api/doctors/{doctor_id}/schedules/{schedule_id}/available-slots/` | Get specific schedule's available time slots | Public |

---

## 🏥 **Patient Management Endpoints**

### **Patient Profiles**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/patient/profile/` | List user's patient profiles | Authenticated (Own) |
| `POST` | `/api/patient/profile/` | Create patient profile | Authenticated (Own) |
| `GET` | `/api/patient/profile/{id}/` | Get patient profile details | Authenticated (Own) |
| `PUT` | `/api/patient/profile/{id}/` | Update patient profile | Authenticated (Own) |
| `PATCH` | `/api/patient/profile/{id}/` | Partial update patient profile | Authenticated (Own) |
| `DELETE` | `/api/patient/profile/{id}/` | Delete patient profile | Authenticated (Own) |

### **Medical History**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/patient/medical-history/` | List user's medical history | Authenticated (Own) |
| `POST` | `/api/patient/medical-history/` | Create medical history record | Authenticated (Own) |
| `GET` | `/api/patient/medical-history/{id}/` | Get medical history details | Authenticated (Own) |
| `PUT` | `/api/patient/medical-history/{id}/` | Update medical history | Authenticated (Own) |
| `PATCH` | `/api/patient/medical-history/{id}/` | Partial update medical history | Authenticated (Own) |
| `DELETE` | `/api/patient/medical-history/{id}/` | Delete medical history | Authenticated (Own) |

---

## 📅 **Appointment Management Endpoints**

### **Appointments**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `GET` | `/api/appointment/my-appointments/` | List user's appointments | Authenticated (Own) |
| `POST` | `/api/appointment/my-appointments/` | Create appointment (alternative method) | Authenticated (Own) |
| `GET` | `/api/appointment/my-appointments/{id}/` | Get appointment details | Authenticated (Own) |
| `PUT` | `/api/appointment/my-appointments/{id}/` | Update appointment | Authenticated (Own) |
| `PATCH` | `/api/appointment/my-appointments/{id}/` | Partial update appointment | Authenticated (Own) |
| `DELETE` | `/api/appointment/my-appointments/{id}/` | Delete appointment | Authenticated (Own) |

### **Appointment Actions**
| Method | Endpoint | Functionality | Permission |
|--------|----------|---------------|------------|
| `POST` | `/api/appointment/book/{doctor_id}/` | Book appointment with doctor | Authenticated |
| `POST` | `/api/appointment/cancel/{appointment_id}/` | Cancel appointment | Authenticated (Own) |

---

## 📋 **Quick Reference - What You Can Create**

### **✅ Can Create via Browsable API:**
1. **Specialties** → `POST /api/specialties/`
2. **Languages** → `POST /api/languages/`
3. **Doctors** → `POST /api/doctors/`
4. **Doctor Schedules** → `POST /api/schedules/`
5. **Patient Profiles** → `POST /api/patient/profile/`
6. **Medical History** → `POST /api/patient/medical-history/`
7. **Appointments** → `POST /api/appointment/my-appointments/`

### **🔒 Permission Levels:**
- **Public**: Anyone can access
- **Authenticated**: Must be logged in
- **Authenticated (Own)**: Must be logged in and can only access own data