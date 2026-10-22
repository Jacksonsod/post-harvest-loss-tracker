/**
 * API client for the NISR Post-Harvest Loss Tracker FastAPI backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        errorMsg = errorData.detail || errorMsg;
      } catch (e) {
        // fallback to status text
      }
      const err = new Error(errorMsg);
      err.status = res.status;
      throw err;
    }
    return await res.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      const offlineErr = new Error('Backend offline. Make sure FastAPI server is running on port 8000.');
      offlineErr.status = 503;
      throw offlineErr;
    }
    throw err;
  }
}

export const api = {
  checkHealth: () => request('/health'),
  getCoops: () => request('/coops'),
  createCoop: (data) => request('/coop', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getBenchmark: (district, crop, season) => {
    const params = new URLSearchParams({ district, crop });
    if (season) params.append('season', season);
    return request(`/benchmark?${params.toString()}`);
  },
  submitAssessment: (data) => request('/assess', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getAssessments: (coopId) => request(`/assessments/${coopId}`),
  getOptions: () => request('/options'),
  getEstimate: (district, crop, season, projectedHarvestKg) => {
    const params = new URLSearchParams({ district, crop, season, projected_harvest_kg: projectedHarvestKg });
    return request(`/estimate?${params.toString()}`);
  },
  getAssessmentSummary: (assessmentId) => request(`/assess/${assessmentId}/summary`),
  getDispatchTriggers: (district) => {
    const url = district ? `/overview/dispatch-triggers?district=${encodeURIComponent(district)}` : '/overview/dispatch-triggers';
    return request(url);
  },
  getOutliers: (thresholdMultiplier = 1.5) => request(`/overview/outliers?threshold_multiplier=${thresholdMultiplier}`),
  getPolicyAlignment: () => request('/overview/policy-alignment'),
  getStorageComparison: (crop) => request(`/overview/storage-comparison?crop=${encodeURIComponent(crop)}`),
};
