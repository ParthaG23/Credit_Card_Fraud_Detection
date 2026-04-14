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
    POST /predict-batch      -> accepts CSV file, returns predictions + analytics
    GET  /batch-history      -> returns log of previous batch uploads
    GET  /dataset-stats      -> returns dataset statistics
"""

import os
import json
import joblib
import pandas as pd
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
CORS(app)

# Uploads & History Configuration
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
HISTORY_FILE  = os.path.join(UPLOAD_FOLDER, 'history.json')

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
    print(f"[OK] Created uploads directory: {UPLOAD_FOLDER}")

if not os.path.exists(HISTORY_FILE):
    with open(HISTORY_FILE, 'w') as f:
        json.dump([], f)
    print(f"[OK] Created history file: {HISTORY_FILE}")

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

df_full  = None
df_fraud = None
df_legit = None

try:
    df_full = pd.read_csv(DATA_PATH)
    df_full = df_full.dropna(subset=[TARGET_COL])
    df_fraud = df_full[df_full[TARGET_COL] == 1.0]
    df_legit = df_full[df_full[TARGET_COL] == 0.0]
    print(f"[OK] Data loaded: {len(df_full)} rows | "
          f"Fraud: {len(df_fraud)} | Legit: {len(df_legit)}")
except Exception as e:
    print(f"[WARN] Data could not be loaded: {e}")


# ---------------------------------------------------------------------------
# Helper: build model-ready feature matrix from a raw dataframe
# ---------------------------------------------------------------------------
def preprocess_batch(df_input: pd.DataFrame) -> pd.DataFrame:
    df = df_input.copy()

    cols_to_drop = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=cols_to_drop)

    if TARGET_COL in df.columns:
        df = df.drop(columns=[TARGET_COL])

    if TIME_COL in df.columns:
        ts = pd.to_datetime(df[TIME_COL], errors="coerce")
        df["hour"]        = ts.dt.hour.fillna(12).astype(int)
        df["day_of_week"] = ts.dt.dayofweek.fillna(0).astype(int)
        df = df.drop(columns=[TIME_COL])
    else:
        df["hour"]        = 12
        df["day_of_week"] = 0

    for col in NUM_COLS:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
        else:
            df[col] = 0

    for col in CAT_COLS:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown").astype(str)
        else:
            df[col] = "Unknown"

    for col, values in KNOWN_CAT_VALS.items():
        for v in values:
            df[f"{col}_{v}"] = (df[col] == v).astype(int)
        df[f"{col}_Unknown"] = (~df[col].isin(values)).astype(int)
        df = df.drop(columns=[col])

    if FEATURE_COLUMNS:
        for col in FEATURE_COLUMNS:
            if col not in df.columns:
                df[col] = 0
        df = df[FEATURE_COLUMNS]

    return df


def preprocess_transaction(raw: dict) -> pd.DataFrame:
    df_raw = pd.DataFrame([raw])
    return preprocess_batch(df_raw)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "status"      : "online",
        "message"     : "NexusGuard Flask API is running.",
        "model_loaded": model is not None,
        "data_loaded" : df_full is not None,
    })


@app.route("/sample-transaction", methods=["GET"])
def sample_transaction():
    if df_full is None:
        return jsonify({"error": "Dataset not available for sampling."}), 500

    trans_type = request.args.get("type", "legit")

    try:
        pool   = df_fraud if trans_type == "fraud" else df_legit
        sample = pool.sample(1).iloc[0].to_dict()

        true_class = int(sample.get(TARGET_COL, 0))

        for col in [TARGET_COL, "transaction_id", "customer_id",
                    "merchant_id", "fraud_type"]:
            sample.pop(col, None)

        sample = {
            k: (None if (isinstance(v, float) and pd.isna(v)) else v)
            for k, v in sample.items()
        }

        return jsonify({"transaction": sample, "true_class": true_class})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------------------------------------------
# Batch prediction with full analytics
# ---------------------------------------------------------------------------

@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    """
    Accepts a CSV file upload, runs batch predictions, saves the file,
    logs the summary to history, and returns rich analytics.
    """
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

    if "file" not in request.files:
        return jsonify({"error": "No file part in the request."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file."}), 400

    if not file.filename.endswith(".csv"):
        return jsonify({"error": "Only CSV files are supported."}), 400

    try:
        # 1. Save the uploaded file
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename  = f"batch_{timestamp}_{file.filename}"
        save_path = os.path.join(UPLOAD_FOLDER, filename)
        file.seek(0)
        file.save(save_path)

        # 2. Load and preprocess
        df_raw = pd.read_csv(save_path)
        if df_raw.empty:
            return jsonify({"error": "The uploaded CSV is empty."}), 400

        X     = preprocess_batch(df_raw)
        preds = model.predict(X)
        probs = (model.predict_proba(X)[:, 1].tolist()
                 if hasattr(model, "predict_proba")
                 else [0.5] * len(preds))

        # Attach predictions back to raw df for analytics
        df_work           = df_raw.copy()
        df_work["_pred"]  = [int(p) for p in preds]
        df_work["_prob"]  = probs

        # 3. Build per-row results
        results     = []
        fraud_count = 0

        for i in range(len(df_raw)):
            is_fraud = int(preds[i]) == 1
            if is_fraud:
                fraud_count += 1
            raw_amount = df_raw.iloc[i].get("amount", 0)
            try:
                parsed_amount = float(str(raw_amount).replace(",", ""))
            except (ValueError, TypeError):
                parsed_amount = 0.0
            import math
            if math.isnan(parsed_amount):
                parsed_amount = 0.0
            results.append({
                "id"         : str(df_raw.iloc[i].get("transaction_id", i)),
                "amount"     : parsed_amount,
                "card_type"  : str(df_raw.iloc[i].get("card_type", "Unknown")),
                "location"   : str(df_raw.iloc[i].get("location", "Unknown")),
                "category"   : str(df_raw.iloc[i].get("purchase_category", "Unknown")),
                "prediction" : int(preds[i]),
                "probability": float(probs[i]),
                "is_fraud"   : is_fraud,
            })

        total = len(df_raw)
        summary = {
            "total"     : total,
            "fraud"     : fraud_count,
            "legit"     : total - fraud_count,
            "fraud_rate": round(fraud_count / total * 100, 2),
            "timestamp" : datetime.now().isoformat(),
            "filename"  : filename,
        }

        # 4. Analytics ────────────────────────────────────────────────────────

        def grouped_breakdown(col):
            """[{name, fraud, legit, total, fraud_rate}] grouped by categorical col."""
            if col not in df_work.columns:
                return []
            out = []
            for val, grp in df_work.groupby(col):
                f = int((grp["_pred"] == 1).sum())
                l = len(grp) - f
                out.append({
                    "name"      : str(val),
                    "fraud"     : f,
                    "legit"     : l,
                    "total"     : len(grp),
                    "fraud_rate": round(f / len(grp) * 100, 2),
                })
            out.sort(key=lambda x: x["fraud"], reverse=True)
            return out

        # Probability distribution buckets
        prob_buckets = [
            {"range": "0-10%",   "min": 0.00, "max": 0.10, "count": 0, "color": "#10B981"},
            {"range": "10-25%",  "min": 0.10, "max": 0.25, "count": 0, "color": "#06B6D4"},
            {"range": "25-50%",  "min": 0.25, "max": 0.50, "count": 0, "color": "#F59E0B"},
            {"range": "50-75%",  "min": 0.50, "max": 0.75, "count": 0, "color": "#F97316"},
            {"range": "75-100%", "min": 0.75, "max": 1.01, "count": 0, "color": "#EF4444"},
        ]
        for p in probs:
            for b in prob_buckets:
                if b["min"] <= p < b["max"]:
                    b["count"] += 1
                    break

        # Risk level distribution
        risk_counts = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
        for p in probs:
            pct = p * 100
            if pct > 70:
                risk_counts["Critical"] += 1
            elif pct > 40:
                risk_counts["High"] += 1
            elif pct > 15:
                risk_counts["Medium"] += 1
            else:
                risk_counts["Low"] += 1

        # Amount statistics
        fraud_amounts = [r["amount"] for r in results if r["is_fraud"]]
        legit_amounts = [r["amount"] for r in results if not r["is_fraud"]]

        def safe_stats(vals):
            import math
            clean = [v for v in vals if not math.isnan(v)]
            if not clean:
                return {"avg": 0, "min": 0, "max": 0, "total": 0}
            return {
                "avg"  : round(sum(clean) / len(clean), 2),
                "min"  : round(min(clean), 2),
                "max"  : round(max(clean), 2),
                "total": round(sum(clean), 2),
            }

        # Top 10 highest-probability fraud transactions
        top_fraud = sorted(
            [r for r in results if r["is_fraud"]],
            key=lambda x: x["probability"], reverse=True
        )[:10]

        analytics = {
            "by_card_type"          : grouped_breakdown("card_type"),
            "by_location"           : grouped_breakdown("location"),
            "by_category"           : grouped_breakdown("purchase_category"),
            "prob_distribution"     : [
                {k: v for k, v in b.items() if k not in ("min", "max")}
                for b in prob_buckets
            ],
            "risk_levels"           : [
                {"level": lvl, "count": cnt, "color": color}
                for lvl, cnt, color in [
                    ("Low",      risk_counts["Low"],      "#10B981"),
                    ("Medium",   risk_counts["Medium"],   "#06B6D4"),
                    ("High",     risk_counts["High"],     "#F59E0B"),
                    ("Critical", risk_counts["Critical"], "#EF4444"),
                ]
            ],
            "amount_stats"          : {
                "fraud": safe_stats(fraud_amounts),
                "legit": safe_stats(legit_amounts),
            },
            "top_fraud_transactions": top_fraud,
        }

        # 5. Log to history
        try:
            with open(HISTORY_FILE, "r+") as f:
                history = json.load(f)
                history.insert(0, summary)
                f.seek(0)
                json.dump(history, f, indent=4)
                f.truncate()
        except Exception as e:
            print(f"[WARN] Failed to update history.json: {e}")

        return jsonify({
            "summary"  : summary,
            "analytics": analytics,
            "results"  : results,
        })

    except Exception as e:
        import traceback
        return jsonify({
            "error"  : "Batch prediction failed.",
            "details": str(e),
            "trace"  : traceback.format_exc(),
        }), 500


@app.route("/batch-history", methods=["GET"])
def get_batch_history():
    """Returns the log of previous batch uploads."""
    try:
        with open(HISTORY_FILE, "r") as f:
            history = json.load(f)
        return jsonify(history)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts a JSON body with raw transaction fields,
    preprocesses them and returns a prediction.
    """
    if model is None:
        return jsonify({"error": "Model not loaded."}), 500

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


@app.route("/dataset-stats", methods=["GET"])
def dataset_stats():
    """Dataset statistics used by the Analytics page."""
    if df_full is None:
        return jsonify({"error": "Dataset not available."}), 500
    return jsonify({
        "total"     : len(df_full),
        "fraud"     : len(df_fraud),
        "legit"     : len(df_legit),
        "fraud_rate": round(len(df_fraud) / len(df_full) * 100, 2),
    })


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
