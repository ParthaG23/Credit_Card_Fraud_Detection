from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import random
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
CORS(app)

# Load the trained model
try:
    default_model_path = os.path.join(BASE_DIR, "..", "model", "model.pkl")
    model_path = os.getenv("MODEL_PATH", default_model_path)
    model = joblib.load(model_path)
    print("Model loaded successfully.")
except Exception as e:
    model = None
    print(f"Warning: Model not found or error loading model: {str(e)}")

# Load dataset for random sampling
try:
    default_data_path = os.path.join(BASE_DIR, "..", "data", "creditcard.csv")
    data_path = os.getenv("DATA_PATH", default_data_path)
    df_data = pd.read_csv(data_path)
    df_data = df_data.drop(columns=['Time', 'Amount'])
    df_fraud = df_data[df_data['Class'] == 1]
    df_legit = df_data[df_data['Class'] == 0]
    print("Data loaded for sampling.")
except Exception as e:
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
        return jsonify({"error": "Data not available for sampling."}), 500
        
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
