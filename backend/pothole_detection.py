import cv2 as cv
import numpy as np
import time
import geocoder
import os
from datetime import datetime
import pyttsx3
import threading

# Initialize text-to-speech engine
engine = pyttsx3.init()

def speak(text):
    """Function to handle text-to-speech output."""
    engine.say(text)
    engine.runAndWait()

try:
    x = datetime.now().strftime('%Y-%m-%d %H-%M-%S')
    print(x)

    class_name = []
    with open(r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\utils\obj.names", 'r') as f:
        class_name = [cname.strip() for cname in f.readlines()]

    net1 = cv.dnn.readNet(r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\utils\yolov4_tiny.weights", r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\utils\yolov4_tiny.cfg")
    net1.setPreferableBackend(cv.dnn.DNN_BACKEND_CUDA)
    net1.setPreferableTarget(cv.dnn.DNN_TARGET_CUDA_FP16)
    model1 = cv.dnn_DetectionModel(net1)
    model1.setInputParams(size=(640, 480), scale=1/255, swapRB=True)

    cap = cv.VideoCapture(r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\test.mp4")
    if not cap.isOpened():
        raise Exception("Failed to open video file")

    ret, frame = cap.read()
    if not ret:
        raise Exception("Failed to capture video")

    width = cap.get(3)
    height = cap.get(4)

    result = cv.VideoWriter(r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\result.avi", cv.VideoWriter_fourcc(*'MJPG'), 10, (int(width), int(height)))

    g = geocoder.ip('me')
    result_path = r"C:\Users\prath\Downloads\YOLO Projects\Pothole-Detection-System-using-YOLO-Tiny-v4\pothole_coordinates"
    starting_time = time.time()
    Conf_threshold = 0.5
    NMS_threshold = 0.4
    frame_counter = 0
    i = 0
    b = 0

    # Variables to manage the speech delay and alert sequence
    last_warning_time = 0
    warning_delay = 3  # 3 seconds delay
    alert_sequence = [1, 2, 2, 1]  # Alert pattern: 1 right, 2 left, 2 right, 1 left
    alert_counter = 0  # Tracks current alert position in the pattern

    # Define the region of interest (ROI) mask
    mask = np.zeros_like(frame)
    mask[0:int(0.85 * height), :] = 255

    while True:
        try:
            ret, frame = cap.read()
            frame_counter += 1
            if not ret:
                break

            # Apply the mask to the frame
            masked_frame = cv.bitwise_and(frame, mask)

            classes, scores, boxes = model1.detect(masked_frame, Conf_threshold, NMS_threshold)
            for (classid, score, box) in zip(classes, scores, boxes):
                label = "pothole"
                x, y, w, h = box
                recarea = w * h
                area = width * height

                severity = ""
                severity_threshold_low = 0.007
                severity_threshold_medium = 0.020

                if len(scores) != 0 and scores[0] >= 0.7:
                    if (recarea / area) <= severity_threshold_low:
                        severity = "Low"
                    elif (recarea / area) <= severity_threshold_medium:
                        severity = "Medium"
                    else:
                        severity = "High"

                    if severity != "":
                        cv.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 1)
                        cv.putText(frame, f"%{round(scores[0] * 100, 2)} {label} ({severity} Severity)",
                                   (box[0], box[1] - 10), cv.FONT_HERSHEY_COMPLEX, 0.5, (255, 0, 0), 1)

                        # Check for high severity and trigger warning with delay
                        if severity == "High":
                            current_time = time.time()
                            if current_time - last_warning_time >= warning_delay:
                                # Get current alert count and side based on the pattern
                                alert_count = alert_sequence[alert_counter % len(alert_sequence)]
                                side = "right" if alert_counter % 2 == 0 else "left"

                                # Speak the alert the specified number of times
                                for _ in range(alert_count):
                                    threading.Thread(target=speak, args=(f"Deep puddle ahead on the {side} side!",)).start()
                                    time.sleep(1)  # Delay between repeated alerts

                                # Update alert time and cycle
                                last_warning_time = current_time
                                alert_counter += 1  # Move to the next alert in the sequence

                        if i == 0:
                            cv.imwrite(os.path.join(result_path, 'pot' + str(i) + '.jpg'), frame)
                            with open(os.path.join(result_path, 'pot' + str(i) + '.txt'), 'w') as f:
                                f.write(f"{str(g.latlng)}\nSeverity: {severity}")
                                i += 1

                        if i != 0:
                            if (time.time() - b) >= 2:
                                cv.imwrite(os.path.join(result_path, 'pot' + str(i) + '.jpg'), frame)
                                with open(os.path.join(result_path, 'pot' + str(i) + '.txt'), 'w') as f:
                                    f.write(f"{str(g.latlng)}\nSeverity: {severity}")
                                    b = time.time()
                                    i += 1

            endingTime = time.time() - starting_time
            fps = frame_counter / endingTime
            cv.putText(frame, f'FPS: {fps}', (20, 50), cv.FONT_HERSHEY_COMPLEX, 0.7, (0, 255, 0), 2)

            cv.imshow('frame', frame)
            result.write(frame)
            key = cv.waitKey(1)
            if key == ord('q'):
                break

        except Exception as e:
            print(f"Error: {e}")

except Exception as e:
    print(f"Error: {e}")

finally:
    if 'cap' in locals() and cap.isOpened():
        cap.release()
    if 'result' in locals():
        result.release()
    cv.destroyAllWindows()
