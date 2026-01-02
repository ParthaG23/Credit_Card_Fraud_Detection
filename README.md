# Credit Card Fraud Detection System

## Project Overview
The Credit Card Fraud Detection System is a machine learning–based project developed to identify fraudulent credit card transactions. The system analyzes transaction patterns and classifies them as legitimate or fraudulent, helping reduce financial losses and improve transaction security.

This project works on a real-world, highly imbalanced dataset and applies data preprocessing, feature scaling, and supervised learning techniques to build an effective fraud detection model.

## Objectives
- Detect fraudulent credit card transactions accurately  
- Handle highly imbalanced datasets  
- Apply machine learning algorithms for binary classification  
- Evaluate model performance using appropriate metrics  

## Technologies Used
- Programming Language: Python  
- Libraries: Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn  
- Environment: Jupyter Notebook  

## Project Structure

Credit-Card-Fraud-Detection/
├── Data/ (ignored in GitHub)
│   └── creditcard.csv
├── Notebook/
│   └── CreditCardFraudDetection.ipynb
├── README.md
└── .gitignore

## Dataset Information
- Source: Kaggle – Credit Card Fraud Detection Dataset  
- Transactions: European cardholders  
- Features: 30 numerical features (V1–V28, Amount, Time)  
- Target Variable:
  - 0 → Legitimate transaction  
  - 1 → Fraudulent transaction  

Due to GitHub file size limitations, the dataset is not included in this repository.

Dataset Link:
https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud

After downloading, place the dataset inside the Data/ folder.

##  Methodology
1. Data loading and exploration  
2. Data preprocessing and feature scaling  
3. Handling class imbalance  
4. Model training using supervised learning  
5. Model evaluation using accuracy, precision, recall, F1-score, and confusion matrix  

##  Results
- Successfully identified fraudulent transactions  
- Achieved reliable performance on an imbalanced dataset  
- Demonstrated effectiveness of machine learning for fraud detection  

##  How to Run the Project
1. Clone the repository:
   git clone https://github.com/ParthaG23/Credit-Card-Fraud-Detection.git
2. Install required libraries:
   pip install pandas numpy scikit-learn matplotlib seaborn
3. Download the dataset and place it in:
   Data/creditcard.csv
4. Open and run:
   Notebook/CreditCardFraudDetection.ipynb

## Future Enhancements
- Implement advanced models like Random Forest and XGBoost  
- Apply SMOTE for better handling of class imbalance  
- Deploy the model using Flask or FastAPI  
- Enable real-time fraud prediction  

## Author
Partha Gayen  
GitHub: https://github.com/ParthaG23  


