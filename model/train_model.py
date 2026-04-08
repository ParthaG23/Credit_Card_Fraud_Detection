import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib
import os

def main():
    print("Loading data...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(base_dir, "..", "data", "creditcard.csv")

    try:
        data = pd.read_csv(data_path)
    except FileNotFoundError:
        print("Dataset not found. Please ensure data/creditcard.csv exists.")
        return

    print(f"Dataset shape: {data.shape}")
    print(f"Class distribution:\n{data['Class'].value_counts()}")

    print("\nPreprocessing data...")
    data = data.dropna()
    # Drop columns not used for prediction
    data = data.drop(columns=['Time', 'Amount'])
    
    X = data.drop('Class', axis=1)
    y = data['Class']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Train class distribution: {dict(y_train.value_counts())}")

    print("\nTraining Random Forest Classifier...")
    # Use class_weight='balanced' to handle class imbalance properly
    # This adjusts weights inversely proportional to class frequencies
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)

    print("\nEvaluating model...")
    y_pred = rf.predict(X_test)
    y_proba = rf.predict_proba(X_test)[:, 1]

    print(f"\n{classification_report(y_test, y_pred, target_names=['Legitimate', 'Fraud'])}")
    print(f"Accuracy:  {accuracy_score(y_test, y_pred):.4f}")
    print(f"Precision: {precision_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"Recall:    {recall_score(y_test, y_pred, zero_division=0):.4f}")
    print(f"F1 Score:  {f1_score(y_test, y_pred, zero_division=0):.4f}")

    # Feature importance
    feature_importance = pd.Series(rf.feature_importances_, index=X.columns)
    print(f"\nTop 10 Features:")
    for feat, imp in feature_importance.nlargest(10).items():
        print(f"  {feat}: {imp:.4f}")

    model_path = os.path.join(base_dir, "model.pkl")
    print(f"\nSaving model to {model_path}...")
    joblib.dump(rf, model_path)
    print("Model saved successfully!")

if __name__ == "__main__":
    main()
