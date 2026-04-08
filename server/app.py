"""
app.py  -  NexusGuard Flask API
================================
Backend for the Credit Card Fraud Detection system.

Dataset columns (creditcard.csv):
    transaction_id, customer_id, merchant_id  -> identifiers (dropped)
    amount               -> numeric feature
    transaction_time     -> datetime string -> hour + day_of_week features
    is_fraudulent        -> 0 / 1 target label
    card_type            -> categorical (Rupay, MasterCard, Visa)
    location             -> categorical (city names)
    purchase_category    -> categorical (POS, Digital)
    customer_age         -> numeric feature
    fraud_type           -> label description (dropped, data leakage)

Endpoints:
    GET  /                   -> health check
    GET  /sample-transaction -> returns a random raw transaction from the CSV
    POST /predict            -> accepts raw transaction fields, returns prediction
"""

import os
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Column constants  (mirror train_model.py)
# ---------------------------------------------------------------------------
DROP_COLS       = ["transaction_id", "customer_id", "merchant_id", "fraud_type"]
TARGET_COL      = "is_fraudulent"
TIME_COL        = "transaction_time"
NUM_COLS        = ["amount", "customer_age"]
CAT_COLS        = ["card_type", "location", "purchase_category"]
KNOWN_CAT_VALS  = {
    "card_type"         : ["MasterCard", "Rupay", "Visa"],
    "location"          : ["Ahmedabad", "Bangalore", "Chennai", "Delhi",
                           "Hyderabad", "Jaipur", "Kolkata", "Mumbai",
                           "Pune", "Surat"],
    "purchase_category" : ["Digital", "POS"],
}

# ---------------------------------------------------------------------------
# Load model + feature columns
# ---------------------------------------------------------------------------
MODEL_PATH   = os.environ.get("MODEL_PATH",
                              os.path.join(BASE_DIR, "..", "model", "model.pkl"))
COLUMNS_PATH = os.environ.get("COLUMNS_PATH",
                              os.path.join(BASE_DIR, "..", "model", "feature_columns.pkl"))

model = None
FEATURE_COLUMNS = None

try:
    model = joblib.load(MODEL_PATH)
    print(f"[OK] Model loaded from {MODEL_PATH}")
except Exception as e:
    print(f"[WARN] Model could not be loaded: {e}")

try:
    FEATURE_COLUMNS = joblib.load(COLUMNS_PATH)
    print(f"[OK] Feature columns loaded: {FEATURE_COLUMNS}")
except Exception as e:
    print(f"[WARN] Feature columns could not be loaded: {e}")

# ---------------------------------------------------------------------------
# Load dataset for sampling
# ---------------------------------------------------------------------------
DATA_PATH = os.environ.get("DATA_PATH",
                           os.path.join(BASE_DIR, "..", "data", "creditcard.csv"))

df_full   = None   # full raw dataframe (for sampling raw rows)
df_fraud  = None   # fraud rows (raw)
df_legit  = None   # legit rows (raw)

try:
    df_full = pd.read_csv(DATA_PATH)
    # Drop rows with missing target
    df_full = df_full.dropna(subset=[TARGET_COL])
    df_fraud = df_full[df_full[TARGET_COL] == 1.0]
    df_legit = df_full[df_full[TARGET_COL] == 0.0]
    print(f"[OK] Data loaded: {len(df_full)} rows | "
          f"Fraud: {len(df_fraud)} | Legit: {len(df_legit)}")
except Exception as e:
    print(f"[WARN] Data could not be loaded: {e}")


# ---------------------------------------------------------------------------
# Helper: build model-ready feature matrix from a raw transaction dict
# ---------------------------------------------------------------------------
def preprocess_transaction(raw: dict) -> pd.DataFrame:
    """
    Accepts a raw transaction dict (same fields as creditcard.csv rows,
    minus the target and leaky columns) and returns a one-row DataFrame
    aligned to FEATURE_COLUMNS.
    """
    df = pd.DataFrame([raw])

    # ── Drop identifier / leaky columns if present ───────────────────────────
    cols_to_drop = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=cols_to_drop)

    # ── Drop target if accidentally included ──────────────────────────────────
    if TARGET_COL in df.columns:
        df = df.drop(columns=[TARGET_COL])

    # ── Feature-engineer datetime ─────────────────────────────────────────────
    if TIME_COL in df.columns:
        ts = pd.to_datetime(df[TIME_COL], errors="coerce")
        df["hour"]        = ts.dt.hour.fillna(12).astype(int)
        df["day_of_week"] = ts.dt.dayofweek.fillna(0).astype(int)
        df = df.drop(columns=[TIME_COL])

    # ── Fill numeric NaNs with 0 ──────────────────────────────────────────────
    for col in NUM_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    # ── Fill categorical NaNs with 'Unknown' ──────────────────────────────────
    for col in CAT_COLS:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown").astype(str)

    # ── One-hot encode categoricals using known values ────────────────────────
    for col, values in KNOWN_CAT_VALS.items():
        if col in df.columns:
            col_val = df[col].iloc[0]
            for v in values:
                df[f"{col}_{v}"] = int(col_val == v)
            # Unknown sentinel
            df[f"{col}_Unknown"] = int(col_val not in values)
            df = df.drop(columns=[col])

    # ── Align to training columns (add zeros for missing, drop extras) ─────────
    if FEATURE_COLUMNS:
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0
        df = df[FEATURE_COLUMNS]

    return df


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status"  : "online",
        "message" : "NexusGuard Flask API is running.",
        "model_loaded": model is not None,
        "data_loaded" : df_full is not None,
    })


@app.route("/sample-transaction", methods=["GET"])
def sample_transaction():
    """
    Returns a random raw transaction from the dataset.
    Query param: type=legit|fraud  (default: legit)
    Response:
        transaction: dict of raw column values (excl. target)
        true_class : 0 or 1
    """
    if df_full is None:
        return jsonify({"error": "Dataset not available for sampling."}), 500

    trans_type = request.args.get("type", "legit")

    try:
        pool   = df_fraud if trans_type == "fraud" else df_legit
        sample = pool.sample(1).iloc[0].to_dict()

        # Pull out true label before sending to client
        true_class = int(sample.get(TARGET_COL, 0))

        # Remove columns the frontend / model doesn't need to see
        for col in [TARGET_COL, "transaction_id", "customer_id",
                    "merchant_id", "fraud_type"]:
            sample.pop(col, None)

        # Convert any NaN to None for JSON serialisation
        sample = {
            k: (None if (isinstance(v, float) and pd.isna(v)) else v)
            for k, v in sample.items()
        }

        return jsonify({"transaction": sample, "true_class": true_class})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts a JSON body with the raw transaction fields (same as returned by
    /sample-transaction), preprocesses them and returns a prediction.

    Response:
        predictions : [0 or 1]
        probability : float  (probability of fraud)
    """
    if model is None:
        return jsonify({
            "error": "Model not loaded. Run model/train_model.py first."
        }), 500

    try:
        raw_data = request.get_json(force=True)
        if not raw_data:
            return jsonify({"error": "Empty request body."}), 400

        X = preprocess_transaction(raw_data)

        prediction  = int(model.predict(X)[0])
        probability = 0.0
        if hasattr(model, "predict_proba"):
            probability = float(model.predict_proba(X)[0][1])

        return jsonify({
            "predictions": [prediction],
            "probability": probability,
        })

    except Exception as e:
        import traceback
        return jsonify({
            "error"  : "Prediction failed.",
            "details": str(e),
            "trace"  : traceback.format_exc(),
        }), 500


# ---------------------------------------------------------------------------
# Dataset stats endpoint (bonus - used by Analytics page)
# ---------------------------------------------------------------------------
@app.route("/dataset-stats", methods=["GET"])
def dataset_stats():
    if df_full is None:
        return jsonify({"error": "Dataset not available."}), 500
    return jsonify({
        "total"      : len(df_full),
        "fraud"      : len(df_fraud),
        "legit"      : len(df_legit),
        "fraud_rate" : round(len(df_fraud) / len(df_full) * 100, 2),
    })


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
