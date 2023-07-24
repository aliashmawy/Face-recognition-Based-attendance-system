import os
from dotenv import load_dotenv
import cv2
import numpy as np
import face_recognition
import requests
import json
from datetime import datetime
import threading
from minio import Minio
from minio.error import MinioException

load_dotenv()

# Connect to MinIO
minio_client = Minio("127.0.0.1:9000",
                     access_key="minioadmin",
                     secret_key="minioadmin",
                     secure=False)

# Create a dictionary to store attendance data
attendance_data = {
    "name": "",
    "time": "",
    "date": "",
    "college_coliseum": os.environ.get('COLLEGE_COLISEUM')
}

# Index server URL
# server_url = "http://localhost:3000/api/attendance"
server_url = "http://192.168.1.3:3000/api/attendance"
# Function to send attendance data by JSON to index server
def send_attendance_data():
    while True:
        if attendance_data["name"] != "":
            headers = {"Content-type": "application/json"}
            data = json.dumps(attendance_data)
            response = requests.post(server_url, data=data, headers=headers)
            print(response.text)
            attendance_data["name"] = ""
            attendance_data["time"] = ""
            attendance_data["date"] = ""
            attendance_data["college_coliseum"] = ""
        else:
            continue

# Start a new thread for sending attendance data to index server
send_data_thread = threading.Thread(target=send_attendance_data)
send_data_thread.start()

def get_encodings_and_names():
    encodeList = []
    classNames = []
    # List all objects in the "students" bucket
    objects = minio_client.list_objects('students')
    
    for obj in objects:
        # Read the contents of each text file in the bucket
        try:
            data = minio_client.get_object('students', obj.object_name)
            encoding_txt = data.data.decode('utf-8')
            encoding_arr = np.array([float(f) for f in encoding_txt.split(',')])
            encodeList.append(encoding_arr)
            classNames.append(obj.object_name.split('.')[0])  # Use the filename without the extension as the class name
        except MinioException as err:
            print(err)
    
    return encodeList, classNames

def mark_attendance(name):
    with open('Attendance.csv', 'a+') as f:
        myDataList = f.readlines()
        nameList = []
        for line in myDataList:
            entry = line.split(',')
            nameList.append(entry[0])
        if name not in nameList:
            time_now = datetime.now()
            tString = time_now.strftime('%H:%M:%S')
            dString = time_now.strftime('%d/%m/%Y')
            f.writelines(f'\n{name},{tString},{dString},{attendance_data["college_coliseum"]}')
            
            # Update attendance data dictionary
            attendance_data["name"] = name
            attendance_data["time"] = tString
            attendance_data["date"] = dString
            attendance_data["college_coliseum"] = os.environ.get('COLLEGE_COLISEUM')
            
            # Send attendance data to index server
            try:
                headers = {"Content-type": "application/json"}
                data = json.dumps(attendance_data)
                response = requests.post(server_url, data=data, headers=headers)
                print(response.text)
            except requests.exceptions.RequestException as e:
                print("Failed to send attendance data:", str(e))
        else:
            print("Attendance already marked for", name)


# Initialize the MinIO client
minio_client = Minio('127.0.0.1:9000',
                     access_key='minioadmin',
                     secret_key='minioadmin',
                     secure=False)

# Retrieve the face encodings and corresponding names from MinIO
encodeListKnown, classNames = get_encodings_and_names()

# cap = cv2.VideoCapture('http://192.168.1.7:8080/video')
cap = cv2.VideoCapture(0)



while True:
    success, img = cap.read()
    imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
    imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
    # detect face
    facesCurFrame = face_recognition.face_locations(imgS)
    encodesCurFrame = face_recognition.face_encodings(imgS, facesCurFrame)

    for encodeFace, faceLoc in zip(encodesCurFrame, facesCurFrame):
        faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
        matchIndexes = np.where(faceDis <= 0.45)[0]  # Find indices where face distance is 0.5 or less
        if len(matchIndexes) > 0:
            matchIndex = matchIndexes[np.argmin(faceDis[matchIndexes])]
            name = classNames[matchIndex].upper()
            print(faceDis)
            print(name)
            y1, x2, y2, x1 = faceLoc
            y1, x2, y2, x1 = y1*4, x2*4, y2*4, x1*4
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.rectangle(img, (x1, y2-35), (x2, y2), (0, 250, 0), cv2.FILLED)
            cv2.putText(img, name, (x1+6, y2-6),
                        cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 2)
            mark_attendance(name)
    cv2.imshow('webcam', img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
cap.release()
cv2.destroyAllWindows()
