# NexusGuard - Credit Card Fraud Detection System

## Project Overview
NexusGuard is a full-stack, machine learning-powered platform developed to identify fraudulent credit card transactions. The system analyzes transaction patterns via a Random Forest model and visualizes results through a premium, responsive React dashboard.

## Project Structure (Monorepo)

```
Credit_Card_Fraud_Detection/
├── client/           # React + Vite frontend dashboard
├── server/           # Flask API backend
├── model/            # ML model and training scripts
├── notebooks/        # Jupyter research notebooks
├── data/             # Dataset directory (ignored in git)
└── docs/             # Technical documentation
```

## Setup Instructions

### 1. Backend Setup

1. **Navigate to the server directory:**
   ```bash
   cd server
   ```
2. **Create a virtual environment & install dependencies:**
   ```bash
   python -m venv .venv
   # Windows: .venv\Scripts\activate
   # Mac/Linux: source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. **Run the Flask API:**
   ```bash
   python app.py
   ```
   *The server runs on http://localhost:5000*

### 2. Frontend Setup

1. **Navigate to the client directory (open a new terminal):**
   ```bash
   cd client
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Run the development server:**
   ```bash
   npm run dev
   ```
   *The frontend runs on http://localhost:5173*

### 3. Model Training (Optional)

1. **Download the dataset:**
   - Source: [Kaggle – Credit Card Fraud Detection](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
   - Place `creditcard.csv` in the `data/` folder.
2. **Navigate to the model directory:**
   ```bash
   cd model
   ```
3. **Install ML dependencies & Run training script:**
   ```bash
   pip install -r requirements.txt
   python train_model.py
   ```
   *This will output a new `model.pkl` in the `model/` folder.*

## Documentation
- [Backend API Docs](docs/API.md)

## Author
Partha Gayen  
GitHub: https://github.com/ParthaG23
