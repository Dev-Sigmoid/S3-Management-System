# 🌐 S3 File Manager - Frontend

This is the **React + Vite + Tailwind** frontend for the **S3 File Manager** project.  
It provides an easy-to-use UI for managing AWS S3 buckets and objects.

---

## ✨ Features
- 📂 List all buckets and their contents  
- ⬆️ Upload files to buckets  
- ❌ Delete files or buckets  
- 🔄 Move or Copy files between buckets  

---

## ⚙️ Setup & Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Dev-Sigmoid/S3-Management-System.git
cd S3-Management-System/s3_file_manager_frontend
```
### 2️⃣ Install Dependencies
```bash
npm i
```

### 3️⃣ Run Frontend
```bash
npm run dev
```

---

# ⚙️ S3 File Manager - Backend

This is the **FastAPI backend** for the **S3 File Manager** project.  
It provides RESTful APIs for interacting with AWS S3 (list, upload, delete, copy, move files and buckets).  

---

## ✨ Features
- 📂 List buckets & objects  
- ⬆️ Upload files  
- ❌ Delete files/buckets  
- 🔄 Copy & Move objects between buckets  

---

## ⚙️ Setup

### 1️⃣ Activate Virtual Environment
```bash
source venv/bin/activate
```

### 2️⃣ AWS Credentials
- Add your AWS credentials to .env file:
```ini
AWS_ACCESS_KEY_ID=YOUR_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_ACCESS_KEY
AWS_REGION=YOUR_REGION
```

### 3️⃣ Run the Server (on Port 4444)
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 4444
```

## Tech Stack
- ⚡ FastAPI → Web framework for building APIs
- 🚀 Uvicorn → ASGI server to run FastAPI apps
- ☁️ Boto3 → AWS SDK for Python (S3 integration)
- 📄 python-multipart → Handles file uploads (multipart/form-data)
- 🔐 python-dotenv → Loads environment variables from .env

---

## 📂 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /buckets | Retrieve all available buckets |
| POST | /bucket/{bucket_name} | Create a new bucket |
| DELETE | /bucket/{bucket_name} | Remove an existing bucket |
| GET | /bucket/{bucket_name} | List all objects within a bucket |
| POST | /upload | Upload files to specified bucket |
| DELETE | /object | Delete specific files |
| POST | /copy | Copy files between buckets |
| POST | /move | Move files to different locations |

---
