from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import random
import os
import requests

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
CORS(app)
load_error = None

# Load the trained model
try:
    default_model_path = os.path.join(BASE_DIR, "..", "model", "model.pkl")
    model_path = os.getenv("MODEL_PATH", default_model_path)
    model = joblib.load(model_path)
    print("Model loaded successfully.")
except Exception as e:
    model = None
    print(f"Warning: Model not found or error loading model: {str(e)}")

# Helper to download large files from Google Drive
def download_file_from_google_drive(url, destination):
    def get_confirm_token(response):
        for key, value in response.cookies.items():
            if key.startswith('download_warning'):
                return value
        return None

    def save_response_content(response, destination):
        CHUNK_SIZE = 32768
        with open(destination, "wb") as f:
            for chunk in response.iter_lines(chunk_size=CHUNK_SIZE):
                if chunk: f.write(chunk)

    if "drive.google.com" in url or "docs.google.com" in url:
        # Extract ID
        if "id=" in url:
            file_id = url.split("id=")[1]
        else:
            file_id = url.split("/")[-2]
            
        URL = "https://docs.google.com/uc?export=download"
        session = requests.Session()
        response = session.get(URL, params={'id': file_id}, stream=True)
        token = get_confirm_token(response)

        if token:
            params = {'id': file_id, 'confirm': token}
            response = session.get(URL, params=params, stream=True)
        
        save_response_content(response, destination)
        return destination
    return url

# Load dataset for random sampling
try:
    default_data_path = os.path.join(BASE_DIR, "..", "data", "creditcard_mini.csv")
    data_path = os.getenv("DATA_PATH", default_data_path)
    
    # If the path is a URL, download it to a temp file first
    if data_path.startswith("http"):
        print(f"Downloading data from remote source: {data_path}")
        local_path = os.path.join(BASE_DIR, "temp_data.csv")
        data_path = download_file_from_google_drive(data_path, local_path)

    df_data = pd.read_csv(data_path)
    df_data = df_data.drop(columns=['Time', 'Amount'])
    df_fraud = df_data[df_data['Class'] == 1]
    df_legit = df_data[df_data['Class'] == 0]
    print("Data loaded for sampling.")
except Exception as e:
    load_error = e
    df_data = None
    df_fraud = None
    df_legit = None
    print(f"Warning: Data not found for sampling: {str(e)}")

EXPECTED_FEATURES = [f'V{i}' for i in range(1, 29)]

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status": "online",
        "message": "NexusGuard Flask API is running."
    })

@app.route("/sample-transaction", methods=["GET"])
def sample_transaction():
    trans_type = request.args.get("type", "legit")
    if df_data is None:
        # Get the error from the global scope if we stored it
        return jsonify({
            "error": "Data not available for sampling.",
            "details": str(globals().get('load_error', 'Unknown error'))
        }), 500
        
    try:
        if trans_type == "fraud":
            sample = df_fraud.sample(1).to_dict('records')[0]
        else:
            sample = df_legit.sample(1).to_dict('records')[0]
            
        # exclude class from frontend returning payload
        target_class = sample.pop('Class')
        return jsonify({"transaction": sample, "true_class": target_class})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/predict", methods=["POST"])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded. Please train the model first."}), 500

    try:
        data = request.get_json()
        df = pd.DataFrame([data])
            
        missing_cols = set(EXPECTED_FEATURES) - set(df.columns)
        if missing_cols:
            return jsonify({"error": f"Missing required features: {missing_cols}"}), 400
            
        X = df[EXPECTED_FEATURES]
        predictions = model.predict(X)
        
        # Get probability if available
        probability = 0
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(X)[0][1]) # Prob of class 1 (Fraud)
            
        return jsonify({
            "predictions": predictions.tolist(),
            "probability": probability
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
