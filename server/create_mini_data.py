import pandas as pd
import os

# Load the big file locally
data_path = r"e:\MY PROGRAMMING JOURNEY\Git Repo\Credit_Card_Fraud_Detection\data\creditcard.csv"
output_path = r"e:\MY PROGRAMMING JOURNEY\Git Repo\Credit_Card_Fraud_Detection\data\creditcard_mini.csv"

if os.path.exists(data_path):
    print("Reading local large dataset...")
    df = pd.read_csv(data_path)
    
    # Take 500 samples of each class
    df_fraud = df[df['Class'] == 1].sample(min(len(df[df['Class'] == 1]), 500), replace=False)
    df_legit = df[df['Class'] == 0].sample(500)
    
    mini_df = pd.concat([df_fraud, df_legit])
    
    # Save to a new file in the data folder
    mini_df.to_csv(output_path, index=False)
    print(f"Successfully created mini-dataset at {output_path}")
else:
    print(f"Error: Large dataset not found at {data_path}")
