# NexusGuard Flask API

## Base URL
`http://localhost:5000`

## Endpoints

### 1. Health Check
Checks if the backend server is running.
- **URL**: `/`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "online",
    "message": "NexusGuard Flask API is running."
  }
  ```

### 2. Sample Transaction
Fetches a sample transaction (either legitimate or fraudulent) from the dataset.
- **URL**: `/sample-transaction`
- **Method**: `GET`
- **Query Params**:
  - `type` (optional): "legit" or "fraud" (default: "legit")
- **Response**:
  ```json
  {
    "transaction": {
      "V1": 0.123,
      "V2": -0.456,
      ...
      "V28": 0.789
    },
    "true_class": 0
  }
  ```

### 3. Predict
Analyzes transaction features using the machine learning model.
- **URL**: `/predict`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**: JSON object containing transaction features (`V1` through `V28`).
- **Response**:
  ```json
  {
    "predictions": [0],
    "probability": 0.05
  }
  ```
