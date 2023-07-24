import cv2
import numpy as np
import face_recognition
import os
import minio
import io
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Connect to MinIO server
minio_client = minio.Minio(
    "127.0.0.1:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

bucket_name = "students"

path = 'Images_Attendance'
images = []
classNames = []

# Put every name of img in myList
myList = os.listdir(path)

# For loop to separate the format from the name
for cl in myList:
    file_path = os.path.join(path, cl)
    with open(file_path, 'rb') as f:
        file_bytes = f.read()
    nparr = np.frombuffer(file_bytes, np.uint8)
    curImg = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    images.append(curImg)
    classNames.append(os.path.splitext(cl)[0])

def save_encoding_to_db(name, encoding):
    encoding_str = ', '.join([str(e) for e in encoding])
    object_name = f"{name}.txt"
    data = io.BytesIO(encoding_str.encode('utf-8'))
    minio_client.put_object(
        bucket_name,
        object_name,
        data,
        len(encoding_str),
        content_type="text/plain",
    )
    print(f"Saved encoding for {name}")

def findEncodings(images):
    for img, name in zip(images, classNames):
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        encodings = face_recognition.face_encodings(img)
        if len(encodings) > 0:
            encoding = encodings[0]
            save_encoding_to_db(name, encoding)

# Call the function to find encodings and store them in MinIO
findEncodings(images)
