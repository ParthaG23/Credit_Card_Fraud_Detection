import pandas as pd
import joblib
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
data_path = os.path.join(BASE_DIR, "..", "data", "creditcard.csv")
model_path = os.path.join(BASE_DIR, "..", "model", "model.pkl")

df = pd.read_csv(data_path)
print(f"Shape: {df.shape}")
print(f"Columns: {list(df.columns)}")
print(f"Class distribution:")
print(df["Class"].value_counts())

# Test model on fraud samples
model = joblib.load(model_path)
df_features = df.drop(columns=["Time", "Amount"])
fraud = df_features[df_features["Class"] == 1].drop(columns=["Class"])
legit = df_features[df_features["Class"] == 0].drop(columns=["Class"])

print(f"\nFraud samples: {len(fraud)}, Legit samples: {len(legit)}")

# Predict on all fraud
fraud_pred = model.predict(fraud)
fraud_proba = model.predict_proba(fraud)[:, 1]
print(f"Fraud correctly detected: {sum(fraud_pred)}/{len(fraud_pred)}")
print(f"Fraud avg probability: {fraud_proba.mean():.4f}")

# Predict on some legit
legit_sample = legit.head(50)
legit_pred = model.predict(legit_sample)
print(f"Legit correctly classified: {sum(legit_pred == 0)}/{len(legit_pred)}")
