from flask import Flask, request, render_template, jsonify, send_from_directory
import os
from werkzeug.utils import secure_filename
import subprocess
import shutil

# Make sure the necessary directories exist
os.makedirs('static/videos', exist_ok=True)
os.makedirs('uploads/', exist_ok=True)
os.makedirs('results/', exist_ok=True)

# Define static folder explicitly
app = Flask(__name__, static_folder='static')

UPLOAD_FOLDER = 'uploads/'
RESULT_FOLDER = 'results/'
STATIC_VIDEO_PATH = os.path.join('static', 'videos', 'result.mp4')

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = RESULT_FOLDER
app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov', 'mkv'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    if 'video' not in request.files:
        return jsonify({"error": "No file part"}), 400

    video_file = request.files['video']
    if video_file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if video_file and allowed_file(video_file.filename):
        filename = secure_filename(video_file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        video_file.save(video_path)

        result_filename = f"processed_{filename}"
        result_path = os.path.join(app.config['RESULT_FOLDER'], result_filename)

        # Call YOLO detection script (update path as needed)
        subprocess.run(['python', 'utils/pothole_detector.py', '--input', video_path, '--output', result_path])

        # Copy result to static/videos/result.mp4 to serve
        static_output_path = os.path.join('static', 'videos', 'result.mp4')
        
        # Ensure directory exists before copying
        os.makedirs(os.path.dirname(static_output_path), exist_ok=True)
        shutil.copy(result_path, static_output_path)

        return jsonify({"result_video": "/watch_video"}), 200

    return jsonify({"error": "Invalid file format"}), 400

@app.route('/watch_video')
def watch_video():
    return render_template('watch_video.html', filename='result.mp4')

if __name__ == '__main__':
    app.run(debug=True)