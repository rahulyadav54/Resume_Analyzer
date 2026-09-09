import os

MAX_RESUMES_PER_REQUEST = int(os.getenv("MAX_RESUMES_PER_REQUEST", "50"))
MAX_RESUMES_TOTAL = int(os.getenv("MAX_RESUMES_TOTAL", "1000"))
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "10"))
