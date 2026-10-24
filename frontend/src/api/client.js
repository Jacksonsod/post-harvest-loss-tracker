/**
 * API client for the NISR Post-Harvest Loss Tracker FastAPI backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { ...options.headers };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const config = {
    headers,
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
      const err = new Error(typeof errorMsg === 'object' ? JSON.stringify(errorMsg) : errorMsg);
      err.status = res.status;
      throw err;
    }
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await res.json();
    }
    return { status: 'ok' };
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
  getNationalSummary: () => request('/overview/national-summary'),
  getMap: (season, crop) => {
    const params = new URLSearchParams();
    if (season && season !== 'all') params.append('season', season);
    if (crop) params.append('crop', crop);
    const qs = params.toString();
    return request(qs ? `/overview/map?${qs}` : '/overview/map');
  },
  getByCrop: (district, season) => {
    const params = new URLSearchParams();
    if (district) params.append('district', district);
    if (season && season !== 'all') params.append('season', season);
    const qs = params.toString();
    return request(qs ? `/overview/by-crop?${qs}` : '/overview/by-crop');
  },
  getTopRisk: (season, limit = 10, minRecords = 30) => {
    const params = new URLSearchParams();
    if (season && season !== 'all') params.append('season', season);
    if (limit) params.append('limit', limit);
    if (minRecords) params.append('min_records', minRecords);
    return request(`/overview/top-risk?${params.toString()}`);
  },
  getAboutData: () => request('/about-data'),
  
  // Dataset Ingestion Endpoints
  getImportFormat: () => request('/datasets/import-format'),
  getImportTemplateUrl: () => `${BASE_URL}/datasets/import-template`,
  previewImportFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/datasets/import-assessments/file?dry_run=true', {
      method: 'POST',
      body: formData,
    });
  },
  importAssessmentsFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return request('/datasets/import-assessments/file', {
      method: 'POST',
      body: formData,
    });
  },
  previewImportJson: (records) => request('/datasets/import-assessments?dry_run=true', {
    method: 'POST',
    body: JSON.stringify({ records }),
  }),
  importAssessmentsJson: (records) => request('/datasets/import-assessments', {
    method: 'POST',
    body: JSON.stringify({ records }),
  }),
  undoImportBatch: (batchId) => request(`/datasets/imports/${batchId}`, {
    method: 'DELETE',
  }),
};
