"""
train_model.py
--------------
Trains a Random Forest model on the actual creditcard.csv dataset.

Dataset columns:
    transaction_id, customer_id, merchant_id  — identifiers (dropped)
    amount               — transaction amount (kept)
    transaction_time     — datetime string (feature-engineered to hour/day_of_week)
    is_fraudulent        — target label (0 = legit, 1 = fraud)
    card_type            — categorical: Rupay, MasterCard, Visa (one-hot encoded)
    location             — categorical: city names (one-hot encoded)
    purchase_category    — categorical: POS, Digital (one-hot encoded)
    customer_age         — numeric (kept)
    fraud_type           — label description (dropped — data leakage risk)

Final features saved alongside the model as feature_columns.pkl for
consistent inference in the Flask API.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "..", "data", "creditcard.csv")
MODEL_PATH   = os.path.join(BASE_DIR, "model.pkl")
COLUMNS_PATH = os.path.join(BASE_DIR, "feature_columns.pkl")

# ── Columns we will NEVER use as features ────────────────────────────────────
DROP_COLS   = ["transaction_id", "customer_id", "merchant_id", "fraud_type"]
TARGET_COL  = "is_fraudulent"
TIME_COL    = "transaction_time"
NUM_COLS    = ["amount", "customer_age"]
CAT_COLS    = ["card_type", "location", "purchase_category"]


def load_and_preprocess(data_path: str) -> tuple[pd.DataFrame, pd.Series]:
    print("-" * 55)
    print("Loading data...")

    df = pd.read_csv(data_path)
    print(f"Raw shape      : {df.shape}")
    print(f"Columns        : {df.columns.tolist()}")
    print(f"Class balance  :\n{df[TARGET_COL].value_counts()}\n")

    # ── Drop leaky/identifier columns ────────────────────────────────────────
    existing_drops = [c for c in DROP_COLS if c in df.columns]
    df = df.drop(columns=existing_drops)

    # ── Extract time features ─────────────────────────────────────────────────
    if TIME_COL in df.columns:
        ts = pd.to_datetime(df[TIME_COL], errors="coerce")
        df["hour"]        = ts.dt.hour.fillna(12).astype(int)
        df["day_of_week"] = ts.dt.dayofweek.fillna(0).astype(int)
        df = df.drop(columns=[TIME_COL])

    # ── Separate target (drop rows where target is NaN) ───────────────────────
    df = df.dropna(subset=[TARGET_COL])
    y = df[TARGET_COL].astype(int)
    df = df.drop(columns=[TARGET_COL])

    # ── Fill missing numerics with median ──────────────────────────────────────
    for col in NUM_COLS:
        if col in df.columns:
            df[col] = df[col].fillna(df[col].median())

    # ── Fill missing categoricals with 'Unknown' ──────────────────────────────
    for col in CAT_COLS:
        if col in df.columns:
            df[col] = df[col].fillna("Unknown")

    # ── One-hot encode categoricals ───────────────────────────────────────────
    df = pd.get_dummies(df, columns=[c for c in CAT_COLS if c in df.columns], drop_first=False)

    print(f"Processed shape: {df.shape}")
    print(f"Features       : {df.columns.tolist()}")
    return df, y


def main():
    # ── Load & preprocess ─────────────────────────────────────────────────────
    if not os.path.exists(DATA_PATH):
        print(f"ERROR: Dataset not found at {DATA_PATH}")
        return

    X, y = load_and_preprocess(DATA_PATH)

    # ── Train / test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain : {len(X_train)} samples  |  Test : {len(X_test)} samples")
    print(f"Train class dist : {dict(y_train.value_counts())}")

    # ── Train model ───────────────────────────────────────────────────────────
    print("\nTraining Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=200,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",   # handles class imbalance
        random_state=42,
        n_jobs=-1,
    )
    rf.fit(X_train, y_train)

    # ── Evaluate ──────────────────────────────────────────────────────────────
    print("\nEvaluating...")
    y_pred  = rf.predict(X_test)
    y_proba = rf.predict_proba(X_test)[:, 1]

    print(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud'])}")
    print(f"Accuracy  : {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision : {precision_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"Recall    : {recall_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"F1 Score  : {f1_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"AUC-ROC   : {roc_auc_score(y_test, y_proba):.4f}")

    # ── Feature importance ────────────────────────────────────────────────────
    fi = pd.Series(rf.feature_importances_, index=X.columns).nlargest(10)
    print("\nTop-10 features:")
    for feat, imp in fi.items():
        print(f"  {feat:30s}  {imp:.4f}")

    # ── Save model + feature column list ─────────────────────────────────────
    joblib.dump(rf, MODEL_PATH)
    joblib.dump(X.columns.tolist(), COLUMNS_PATH)
    print(f"\nModel saved   -> {MODEL_PATH}")
    print(f"Columns saved -> {COLUMNS_PATH}")
    print("-" * 55)
    print("Training complete!")


if __name__ == "__main__":
    main()
