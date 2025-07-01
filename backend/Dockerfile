# 1. Use an official Python runtime as a parent image
FROM python:3.11-slim

# 2. Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# 3. Create and set the working directory
WORKDIR /app

# 4. Install system dependencies (if any)
# (none needed for this project, but this is where you'd add them)

# 5. Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn # Production-ready WSGI server

# 6. Copy the rest of the backend application code
COPY . .

# 7. Expose the port the app runs on
EXPOSE 8000

# 8. Run database migrations and start the server
# This command runs when the container launches.
# We use Gunicorn to serve the application in production.
CMD ["gunicorn", "backend.wsgi:application", "--bind", "0.0.0.0:8000"]