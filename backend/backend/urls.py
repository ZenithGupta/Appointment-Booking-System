from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('authentication.urls')),
    path('api/doctor/', include('doctor.urls')),
    path('api/patient/', include('patient.urls')),
    path('api/appointment/', include('appointment.urls')),
    
    # DRF authentication (for browsable API)
    path('api-auth/', include('rest_framework.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)