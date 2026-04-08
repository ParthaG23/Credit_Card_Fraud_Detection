"""
check_data.py
-------------
Quick sanity-check script to verify the model and dataset are aligned.
Run from the project root:  python server/check_data.py
"""

import os
import joblib
import pandas as pd

BASE_DIR     = os.path.dirname(os.path.abspath(__file__))
DATA_PATH    = os.path.join(BASE_DIR, "..", "data", "creditcard.csv")
MODEL_PATH   = os.path.join(BASE_DIR, "..", "model", "model.pkl")
COLUMNS_PATH = os.path.join(BASE_DIR, "..", "model", "feature_columns.pkl")

# ── Load dataset ──────────────────────────────────────────────────────────────
df = pd.read_csv(DATA_PATH)
df = df.dropna(subset=["is_fraudulent"])
print(f"Dataset shape      : {df.shape}")
print(f"Columns            : {list(df.columns)}")
print(f"Class distribution :")
print(df["is_fraudulent"].value_counts())

# ── Load model + feature columns ──────────────────────────────────────────────
model   = joblib.load(MODEL_PATH)
columns = joblib.load(COLUMNS_PATH)
print(f"\nModel type         : {type(model).__name__}")
print(f"Expected features  : {columns}")

# ── Build feature matrix (same logic as app.py preprocess) ───────────────────
df2 = df.copy()

# Drop identifiers / leaky columns
drop_cols = ["transaction_id", "customer_id", "merchant_id", "fraud_type", "is_fraudulent"]
df2 = df2.drop(columns=[c for c in drop_cols if c in df2.columns])

# Time features
if "transaction_time" in df2.columns:
    ts = pd.to_datetime(df2["transaction_time"], errors="coerce")
    df2["hour"]        = ts.dt.hour.fillna(12).astype(int)
    df2["day_of_week"] = ts.dt.dayofweek.fillna(0).astype(int)
    df2 = df2.drop(columns=["transaction_time"])

# Numeric fill
for col in ["amount", "customer_age"]:
    if col in df2.columns:
        df2[col] = pd.to_numeric(df2[col], errors="coerce").fillna(0)

# Categorical fill + one-hot
for col in ["card_type", "location", "purchase_category"]:
    if col in df2.columns:
        df2[col] = df2[col].fillna("Unknown")

df2 = pd.get_dummies(df2, columns=["card_type", "location", "purchase_category"], drop_first=False)

# Align columns
for col in columns:
    if col not in df2.columns:
        df2[col] = 0
df2 = df2[columns]

y = df["is_fraudulent"].astype(int)

# ── Evaluate ─────────────────────────────────────────────────────────────────
fraud_mask = y == 1
legit_mask = y == 0

fraud_pred  = model.predict(df2[fraud_mask])
fraud_proba = model.predict_proba(df2[fraud_mask])[:, 1]
legit_pred  = model.predict(df2[legit_mask])

print(f"\nFraud samples      : {fraud_mask.sum()}")
print(f"Fraud detected     : {fraud_pred.sum()} / {len(fraud_pred)}")
print(f"Fraud avg proba    : {fraud_proba.mean():.4f}")

print(f"\nLegit samples      : {legit_mask.sum()}")
print(f"Legit correct      : {(legit_pred == 0).sum()} / {len(legit_pred)}")
