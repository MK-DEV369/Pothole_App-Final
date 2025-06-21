# utils/pothole_detector.py

import cv2
import numpy as np
import argparse

# Load YOLOv4-tiny
def load_yolo_model(cfg_path, weights_path, names_path):
    net = cv2.dnn.readNet(weights_path, cfg_path)
    with open(names_path, 'r') as f:
        classes = [line.strip() for line in f.readlines()]
    return net, classes

# Perform pothole detection on the video
def detect_potholes(input_video_path, output_video_path, net, classes):
    # Open the video file
    cap = cv2.VideoCapture(input_video_path)
    if not cap.isOpened():
        print("Error: Unable to open video.")
        return
    
    # Get video frame properties
    frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')  # Codec for output video
    out = cv2.VideoWriter(output_video_path, fourcc, 30.0, (frame_width, frame_height))

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        
        # Prepare the frame for YOLO model
        blob = cv2.dnn.blobFromImage(frame, 0.00392, (416, 416), (0, 0, 0), True, crop=False)
        net.setInput(blob)
        layer_names = net.getLayerNames()
        output_layers = [layer_names[i[0] - 1] for i in net.getUnconnectedLayers()]
        
        # Get detection results
        outs = net.forward(output_layers)
        
        # Process the detection results
        class_ids, confidences, boxes = [], [], []
        for out in outs:
            for detection in out:
                scores = detection[5:]
                class_id = np.argmax(scores)
                confidence = scores[class_id]
                if confidence > 0.5:
                    center_x = int(detection[0] * frame_width)
                    center_y = int(detection[1] * frame_height)
                    w = int(detection[2] * frame_width)
                    h = int(detection[3] * frame_height)
                    x = center_x - w // 2
                    y = center_y - h // 2
                    boxes.append([x, y, w, h])
                    confidences.append(float(confidence))
                    class_ids.append(class_id)

        # Apply Non-Maximum Suppression
        indices = cv2.dnn.NMSBoxes(boxes, confidences, 0.5, 0.4)
        
        # Draw boxes on the frame
        for i in indices.flatten():
            x, y, w, h = boxes[i]
            label = str(classes[class_ids[i]])
            color = (0, 255, 0)  # Green color for detected potholes
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, color, 2)

        # Write the frame with detection
        out.write(frame)

    # Release everything
    cap.release()
    out.release()
    print(f"Processed video saved at: {output_video_path}")

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True, help='Path to input video file')
    parser.add_argument('--output', required=True, help='Path to output video file')
    args = parser.parse_args()

    # Load the YOLO model and class labels
    net, classes = load_yolo_model(
        'utils/yolov4_tiny.cfg', 
        'utils/yolov4_tiny.weights', 
        'utils/obj.names'
    )
    
    # Detect potholes in the input video and save the result
    detect_potholes(args.input, args.output, net, classes)
