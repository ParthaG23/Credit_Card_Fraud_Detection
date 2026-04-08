/**
 * apiService.js
 * Centralized API service for communicating with the Flask backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const apiService = {
  /**
   * Check if the backend server is online
   */
  checkHealth: async () => {
    try {
      const response = await fetch(`${API_BASE}/`, { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      return { online: true, message: data.message };
    } catch {
      return { online: false, message: "Backend offline" };
    }
  },

  /**
   * Fetch a sample transaction from the dataset
   * @param {'legit'|'fraud'} type - Transaction type to sample
   */
  fetchSampleTransaction: async (type) => {
    try {
      const response = await fetch(`${API_BASE}/sample-transaction?type=${type}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return { transaction: data.transaction, trueClass: data.true_class };
    } catch (error) {
      throw new Error(
        "Failed to connect to Python backend. Ensure app.py is running on port 5000. " +
          error.message
      );
    }
  },

  /**
   * Send transaction data to the model for prediction
   * @param {Object} transactionData - Raw transaction feature values
   */
  scanTransaction: async (transactionData) => {
    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return {
        prediction: data.predictions[0],
        probability: data.probability,
        isFraud: data.predictions[0] === 1,
      };
    } catch (error) {
      throw new Error("Scan failed: " + error.message);
    }
  },
};

export default apiService;
