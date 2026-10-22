// Real NISR Seasonal Agricultural Survey 2024-2025 Aggregations
export const NATIONAL_KPIS = {
  nationalAvgLossRate: 11.82,
  sampleSize: 134766,
  districtsCount: 30,
  cropsCount: 21,
  estimatedValueAtRiskRwf: 548200000,
  zeroLossRateShare: 71.9
};

export const NATIONAL_CAUSE_SHARES = {
  "theft": 18.16,
  "insects_pests": 63.43,
  "birds_animals": 3.77,
  "stalks_fallen": 8.26,
  "harvesting_damage": 1.86,
  "transport": 0.85,
  "storage": 1.05,
  "processing": 1.45,
  "packaging": 0.81,
  "sale": 0.35
};

export const TOP_VULNERABLE_CROPS = [
  {
    "crop": "Fruits",
    "loss_rate_pct": 18.82,
    "price_rwf_per_kg": 549.42,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Dessert banana",
    "loss_rate_pct": 17.4,
    "price_rwf_per_kg": 251.36,
    "dominant_cause": "theft"
  },
  {
    "crop": "Paddy rice",
    "loss_rate_pct": 15.44,
    "price_rwf_per_kg": 567.86,
    "dominant_cause": "harvesting_damage"
  },
  {
    "crop": "Maize",
    "loss_rate_pct": 13.43,
    "price_rwf_per_kg": 529.32,
    "dominant_cause": "processing"
  },
  {
    "crop": "Banana for beer",
    "loss_rate_pct": 11.76,
    "price_rwf_per_kg": 218.43,
    "dominant_cause": "theft"
  },
  {
    "crop": "Cooking banana",
    "loss_rate_pct": 11.69,
    "price_rwf_per_kg": 291.59,
    "dominant_cause": "theft"
  },
  {
    "crop": "Climbing bean",
    "loss_rate_pct": 11.62,
    "price_rwf_per_kg": 786.59,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Pea",
    "loss_rate_pct": 11.36,
    "price_rwf_per_kg": 1721.91,
    "dominant_cause": "birds_animals"
  },
  {
    "crop": "Other crops",
    "loss_rate_pct": 11.23,
    "price_rwf_per_kg": 665.13,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Vegetables",
    "loss_rate_pct": 10.46,
    "price_rwf_per_kg": 330.75,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Other cereals",
    "loss_rate_pct": 10.43,
    "price_rwf_per_kg": 1033.48,
    "dominant_cause": "stalks_fallen"
  },
  {
    "crop": "Bush bean",
    "loss_rate_pct": 10.12,
    "price_rwf_per_kg": 609.43,
    "dominant_cause": "harvesting_damage"
  },
  {
    "crop": "Irish potato",
    "loss_rate_pct": 9.25,
    "price_rwf_per_kg": 372.41,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Fodder crops",
    "loss_rate_pct": 8.02,
    "price_rwf_per_kg": 270.03,
    "dominant_cause": "birds_animals"
  },
  {
    "crop": "Soybean",
    "loss_rate_pct": 6.87,
    "price_rwf_per_kg": 823.25,
    "dominant_cause": "harvesting_damage"
  },
  {
    "crop": "Sorghum",
    "loss_rate_pct": 6.83,
    "price_rwf_per_kg": 558.09,
    "dominant_cause": "birds_animals"
  },
  {
    "crop": "Wheat",
    "loss_rate_pct": 6.64,
    "price_rwf_per_kg": 736.78,
    "dominant_cause": "birds_animals"
  },
  {
    "crop": "Cassava",
    "loss_rate_pct": 5.88,
    "price_rwf_per_kg": 1759.66,
    "dominant_cause": "insects_pests"
  },
  {
    "crop": "Groundnut",
    "loss_rate_pct": 4.51,
    "price_rwf_per_kg": 1644.98,
    "dominant_cause": "processing"
  },
  {
    "crop": "Taro & Yams",
    "loss_rate_pct": 3.97,
    "price_rwf_per_kg": 248.55,
    "dominant_cause": "theft"
  },
  {
    "crop": "Sweet potato",
    "loss_rate_pct": 3.9,
    "price_rwf_per_kg": 198.54,
    "dominant_cause": "insects_pests"
  }
];

export const DISTRICT_LOSS_RANKINGS = [
  {
    "district": "Musanze",
    "avg_loss_rate_pct": 14.96,
    "top_crop": "Fruits",
    "top_crop_rate": 32.54,
    "cause_breakdown": {
      "theft": 29.97,
      "insects_pests": 22.85,
      "birds_animals": 12.0,
      "stalks_fallen": 21.22,
      "harvesting_damage": 3.85,
      "transport": 4.97,
      "storage": 1.67,
      "processing": 1.87,
      "packaging": 0.36,
      "sale": 1.26
    }
  },
  {
    "district": "Kamonyi",
    "avg_loss_rate_pct": 14.79,
    "top_crop": "Fodder crops",
    "top_crop_rate": 33.51,
    "cause_breakdown": {
      "theft": 43.45,
      "insects_pests": 21.86,
      "birds_animals": 1.66,
      "stalks_fallen": 15.94,
      "harvesting_damage": 3.95,
      "transport": 2.23,
      "storage": 3.32,
      "processing": 4.24,
      "packaging": 2.1,
      "sale": 1.24
    }
  },
  {
    "district": "Nyagatare",
    "avg_loss_rate_pct": 13.41,
    "top_crop": "Fruits",
    "top_crop_rate": 36.19,
    "cause_breakdown": {
      "theft": 34.21,
      "insects_pests": 14.37,
      "birds_animals": 12.71,
      "stalks_fallen": 21.1,
      "harvesting_damage": 5.83,
      "transport": 1.54,
      "storage": 1.16,
      "processing": 8.32,
      "packaging": 0.39,
      "sale": 0.37
    }
  },
  {
    "district": "Rutsiro",
    "avg_loss_rate_pct": 12.83,
    "top_crop": "Dessert banana",
    "top_crop_rate": 26.32,
    "cause_breakdown": {
      "theft": 42.74,
      "insects_pests": 17.92,
      "birds_animals": 7.34,
      "stalks_fallen": 15.91,
      "harvesting_damage": 4.04,
      "transport": 1.41,
      "storage": 8.61,
      "processing": 1.83,
      "packaging": 0.12,
      "sale": 0.08
    }
  },
  {
    "district": "Gasabo",
    "avg_loss_rate_pct": 12.53,
    "top_crop": "Pea",
    "top_crop_rate": 47.24,
    "cause_breakdown": {
      "theft": 38.95,
      "insects_pests": 24.72,
      "birds_animals": 3.5,
      "stalks_fallen": 27.02,
      "harvesting_damage": 1.4,
      "transport": 1.55,
      "storage": 0.1,
      "processing": 2.05,
      "packaging": 0.07,
      "sale": 0.65
    }
  },
  {
    "district": "Gatsibo",
    "avg_loss_rate_pct": 12.35,
    "top_crop": "Pea",
    "top_crop_rate": 29.84,
    "cause_breakdown": {
      "theft": 51.33,
      "insects_pests": 15.88,
      "birds_animals": 2.55,
      "stalks_fallen": 20.33,
      "harvesting_damage": 5.15,
      "transport": 1.24,
      "storage": 0.11,
      "processing": 2.84,
      "packaging": 0.26,
      "sale": 0.31
    }
  },
  {
    "district": "Kicukiro",
    "avg_loss_rate_pct": 12.12,
    "top_crop": "Fruits",
    "top_crop_rate": 36.86,
    "cause_breakdown": {
      "theft": 53.58,
      "insects_pests": 19.22,
      "birds_animals": 2.29,
      "stalks_fallen": 19.0,
      "harvesting_damage": 1.6,
      "transport": 0.52,
      "storage": 1.25,
      "processing": 2.0,
      "packaging": 0.01,
      "sale": 0.53
    }
  },
  {
    "district": "Nyamasheke",
    "avg_loss_rate_pct": 11.67,
    "top_crop": "Dessert banana",
    "top_crop_rate": 29.65,
    "cause_breakdown": {
      "theft": 24.63,
      "insects_pests": 33.44,
      "birds_animals": 15.29,
      "stalks_fallen": 21.52,
      "harvesting_damage": 1.42,
      "transport": 0.97,
      "storage": 1.5,
      "processing": 0.88,
      "packaging": 0.09,
      "sale": 0.26
    }
  },
  {
    "district": "Nyabihu",
    "avg_loss_rate_pct": 10.79,
    "top_crop": "Sorghum",
    "top_crop_rate": 29.19,
    "cause_breakdown": {
      "theft": 32.65,
      "insects_pests": 24.52,
      "birds_animals": 7.47,
      "stalks_fallen": 2.54,
      "harvesting_damage": 2.07,
      "transport": 5.28,
      "storage": 3.43,
      "processing": 0.28,
      "packaging": 18.37,
      "sale": 3.39
    }
  },
  {
    "district": "Ngoma",
    "avg_loss_rate_pct": 10.7,
    "top_crop": "Vegetables",
    "top_crop_rate": 23.28,
    "cause_breakdown": {
      "theft": 2.43,
      "insects_pests": 95.71,
      "birds_animals": 0.13,
      "stalks_fallen": 1.31,
      "harvesting_damage": 0.14,
      "transport": 0.05,
      "storage": 0.02,
      "processing": 0.17,
      "packaging": 0.03,
      "sale": 0.03
    }
  },
  {
    "district": "Huye",
    "avg_loss_rate_pct": 10.34,
    "top_crop": "Other crops",
    "top_crop_rate": 23.55,
    "cause_breakdown": {
      "theft": 36.63,
      "insects_pests": 24.47,
      "birds_animals": 4.45,
      "stalks_fallen": 30.15,
      "harvesting_damage": 1.96,
      "transport": 0.44,
      "storage": 0.19,
      "processing": 0.9,
      "packaging": 0.71,
      "sale": 0.09
    }
  },
  {
    "district": "Gicumbi",
    "avg_loss_rate_pct": 10.28,
    "top_crop": "Fruits",
    "top_crop_rate": 33.92,
    "cause_breakdown": {
      "theft": 36.34,
      "insects_pests": 29.26,
      "birds_animals": 6.34,
      "stalks_fallen": 13.99,
      "harvesting_damage": 5.71,
      "transport": 3.68,
      "storage": 1.43,
      "processing": 2.22,
      "packaging": 0.63,
      "sale": 0.4
    }
  },
  {
    "district": "Ngororero",
    "avg_loss_rate_pct": 10.26,
    "top_crop": "Irish potato",
    "top_crop_rate": 19.86,
    "cause_breakdown": {
      "theft": 30.68,
      "insects_pests": 31.83,
      "birds_animals": 2.51,
      "stalks_fallen": 18.23,
      "harvesting_damage": 2.89,
      "transport": 0.92,
      "storage": 9.47,
      "processing": 2.59,
      "packaging": 0.4,
      "sale": 0.47
    }
  },
  {
    "district": "Kayonza",
    "avg_loss_rate_pct": 10.25,
    "top_crop": "Paddy rice",
    "top_crop_rate": 54.51,
    "cause_breakdown": {
      "theft": 44.66,
      "insects_pests": 21.02,
      "birds_animals": 5.63,
      "stalks_fallen": 17.29,
      "harvesting_damage": 5.96,
      "transport": 1.15,
      "storage": 0.5,
      "processing": 3.43,
      "packaging": 0.17,
      "sale": 0.19
    }
  },
  {
    "district": "Rulindo",
    "avg_loss_rate_pct": 9.75,
    "top_crop": "Fruits",
    "top_crop_rate": 19.46,
    "cause_breakdown": {
      "theft": 15.99,
      "insects_pests": 29.55,
      "birds_animals": 4.82,
      "stalks_fallen": 21.31,
      "harvesting_damage": 12.19,
      "transport": 4.66,
      "storage": 7.37,
      "processing": 2.49,
      "packaging": 0.49,
      "sale": 1.14
    }
  },
  {
    "district": "Karongi",
    "avg_loss_rate_pct": 9.73,
    "top_crop": "Dessert banana",
    "top_crop_rate": 17.57,
    "cause_breakdown": {
      "theft": 43.72,
      "insects_pests": 17.92,
      "birds_animals": 6.37,
      "stalks_fallen": 20.51,
      "harvesting_damage": 1.21,
      "transport": 1.24,
      "storage": 4.2,
      "processing": 2.8,
      "packaging": 1.02,
      "sale": 1.01
    }
  },
  {
    "district": "Nyaruguru",
    "avg_loss_rate_pct": 9.41,
    "top_crop": "Fodder crops",
    "top_crop_rate": 26.97,
    "cause_breakdown": {
      "theft": 16.46,
      "insects_pests": 18.88,
      "birds_animals": 60.46,
      "stalks_fallen": 3.22,
      "harvesting_damage": 0.43,
      "transport": 0.21,
      "storage": 0.02,
      "processing": 0.32,
      "packaging": 0.01,
      "sale": 0.01
    }
  },
  {
    "district": "Kirehe",
    "avg_loss_rate_pct": 8.82,
    "top_crop": "Fruits",
    "top_crop_rate": 35.34,
    "cause_breakdown": {
      "theft": 39.77,
      "insects_pests": 23.86,
      "birds_animals": 2.87,
      "stalks_fallen": 20.78,
      "harvesting_damage": 7.46,
      "transport": 1.27,
      "storage": 0.42,
      "processing": 2.79,
      "packaging": 0.36,
      "sale": 0.42
    }
  },
  {
    "district": "Bugesera",
    "avg_loss_rate_pct": 8.75,
    "top_crop": "Fruits",
    "top_crop_rate": 36.63,
    "cause_breakdown": {
      "theft": 39.19,
      "insects_pests": 22.01,
      "birds_animals": 5.78,
      "stalks_fallen": 17.38,
      "harvesting_damage": 5.6,
      "transport": 1.27,
      "storage": 1.23,
      "processing": 6.97,
      "packaging": 0.3,
      "sale": 0.27
    }
  },
  {
    "district": "Rusizi",
    "avg_loss_rate_pct": 8.68,
    "top_crop": "Groundnut",
    "top_crop_rate": 20.73,
    "cause_breakdown": {
      "theft": 53.71,
      "insects_pests": 10.99,
      "birds_animals": 2.33,
      "stalks_fallen": 8.59,
      "harvesting_damage": 3.52,
      "transport": 0.82,
      "storage": 0.11,
      "processing": 10.78,
      "packaging": 7.4,
      "sale": 1.76
    }
  },
  {
    "district": "Rubavu",
    "avg_loss_rate_pct": 8.64,
    "top_crop": "Other crops",
    "top_crop_rate": 24.64,
    "cause_breakdown": {
      "theft": 65.69,
      "insects_pests": 7.96,
      "birds_animals": 4.8,
      "stalks_fallen": 8.72,
      "harvesting_damage": 2.16,
      "transport": 7.37,
      "storage": 1.41,
      "processing": 1.16,
      "packaging": 0.58,
      "sale": 0.16
    }
  },
  {
    "district": "Gisagara",
    "avg_loss_rate_pct": 8.57,
    "top_crop": "Dessert banana",
    "top_crop_rate": 18.36,
    "cause_breakdown": {
      "theft": 52.08,
      "insects_pests": 20.74,
      "birds_animals": 4.66,
      "stalks_fallen": 14.48,
      "harvesting_damage": 3.23,
      "transport": 1.33,
      "storage": -0.05,
      "processing": 2.57,
      "packaging": 0.65,
      "sale": 0.31
    }
  },
  {
    "district": "Gakenke",
    "avg_loss_rate_pct": 7.89,
    "top_crop": "Groundnut",
    "top_crop_rate": 19.84,
    "cause_breakdown": {
      "theft": 34.43,
      "insects_pests": 25.15,
      "birds_animals": 3.41,
      "stalks_fallen": 28.83,
      "harvesting_damage": 1.37,
      "transport": 1.03,
      "storage": 3.01,
      "processing": 1.75,
      "packaging": 0.79,
      "sale": 0.24
    }
  },
  {
    "district": "Nyamagabe",
    "avg_loss_rate_pct": 7.6,
    "top_crop": "Maize",
    "top_crop_rate": 17.75,
    "cause_breakdown": {
      "theft": 27.51,
      "insects_pests": 33.31,
      "birds_animals": 7.95,
      "stalks_fallen": 15.46,
      "harvesting_damage": 7.56,
      "transport": 3.02,
      "storage": 0.38,
      "processing": 4.32,
      "packaging": 0.07,
      "sale": 0.42
    }
  },
  {
    "district": "Muhanga",
    "avg_loss_rate_pct": 6.98,
    "top_crop": "Paddy rice",
    "top_crop_rate": 28.64,
    "cause_breakdown": {
      "theft": 40.19,
      "insects_pests": 16.91,
      "birds_animals": 1.49,
      "stalks_fallen": 19.47,
      "harvesting_damage": 4.13,
      "transport": 1.53,
      "storage": 15.13,
      "processing": 0.86,
      "packaging": 0.04,
      "sale": 0.24
    }
  },
  {
    "district": "Nyanza",
    "avg_loss_rate_pct": 6.77,
    "top_crop": "Paddy rice",
    "top_crop_rate": 18.4,
    "cause_breakdown": {
      "theft": 52.91,
      "insects_pests": 20.53,
      "birds_animals": 5.98,
      "stalks_fallen": 11.46,
      "harvesting_damage": 1.52,
      "transport": 0.81,
      "storage": 3.68,
      "processing": 1.53,
      "packaging": 0.12,
      "sale": 1.45
    }
  },
  {
    "district": "Ruhango",
    "avg_loss_rate_pct": 6.74,
    "top_crop": "Pea",
    "top_crop_rate": 15.72,
    "cause_breakdown": {
      "theft": 42.1,
      "insects_pests": 11.08,
      "birds_animals": 2.05,
      "stalks_fallen": 36.76,
      "harvesting_damage": 2.79,
      "transport": 0.99,
      "storage": 3.13,
      "processing": 0.84,
      "packaging": 0.16,
      "sale": 0.1
    }
  },
  {
    "district": "Nyarugenge",
    "avg_loss_rate_pct": 5.9,
    "top_crop": "Vegetables",
    "top_crop_rate": 15.37,
    "cause_breakdown": {
      "theft": 34.57,
      "insects_pests": 13.6,
      "birds_animals": 1.66,
      "stalks_fallen": 37.15,
      "harvesting_damage": 1.04,
      "transport": 1.99,
      "storage": 6.52,
      "processing": 2.64,
      "packaging": 0.67,
      "sale": 0.15
    }
  },
  {
    "district": "Burera",
    "avg_loss_rate_pct": 5.23,
    "top_crop": "Dessert banana",
    "top_crop_rate": 10.64,
    "cause_breakdown": {
      "theft": 28.52,
      "insects_pests": 38.26,
      "birds_animals": 14.96,
      "stalks_fallen": 8.79,
      "harvesting_damage": 5.99,
      "transport": 1.99,
      "storage": 0.52,
      "processing": 0.52,
      "packaging": 0.1,
      "sale": 0.34
    }
  },
  {
    "district": "Rwamagana",
    "avg_loss_rate_pct": 3.57,
    "top_crop": "Paddy rice",
    "top_crop_rate": 13.21,
    "cause_breakdown": {
      "theft": 39.99,
      "insects_pests": 5.98,
      "birds_animals": 2.08,
      "stalks_fallen": 35.48,
      "harvesting_damage": 9.28,
      "transport": 0.73,
      "storage": -0.0,
      "processing": 2.68,
      "packaging": 0.42,
      "sale": 3.35
    }
  }
];

export const DISTRICT_LOSS_RATES = {
  "Bugesera": 8.75,
  "Burera": 5.23,
  "Gakenke": 7.89,
  "Gasabo": 12.53,
  "Gatsibo": 12.35,
  "Gicumbi": 10.28,
  "Gisagara": 8.57,
  "Huye": 10.34,
  "Kamonyi": 14.79,
  "Karongi": 9.73,
  "Kayonza": 10.25,
  "Kicukiro": 12.12,
  "Kirehe": 8.82,
  "Muhanga": 6.98,
  "Musanze": 14.96,
  "Ngoma": 10.7,
  "Ngororero": 10.26,
  "Nyabihu": 10.79,
  "Nyagatare": 13.41,
  "Nyamagabe": 7.6,
  "Nyamasheke": 11.67,
  "Nyanza": 6.77,
  "Nyarugenge": 5.9,
  "Nyaruguru": 9.41,
  "Rubavu": 8.64,
  "Ruhango": 6.74,
  "Rulindo": 9.75,
  "Rusizi": 8.68,
  "Rutsiro": 12.83,
  "Rwamagana": 3.57
};

export const DISTRICT_CAUSE_INTENSITY = {
  "Gasabo": {
    "theft": 38.95,
    "insects_pests": 24.72,
    "birds_animals": 3.5,
    "stalks_fallen": 27.02,
    "harvesting_damage": 1.4,
    "transport": 1.55,
    "storage": 0.1,
    "processing": 2.05,
    "packaging": 0.07,
    "sale": 0.65
  },
  "Kicukiro": {
    "theft": 53.58,
    "insects_pests": 19.22,
    "birds_animals": 2.29,
    "stalks_fallen": 19.0,
    "harvesting_damage": 1.6,
    "transport": 0.52,
    "storage": 1.25,
    "processing": 2.0,
    "packaging": 0.01,
    "sale": 0.53
  },
  "Nyanza": {
    "theft": 52.91,
    "insects_pests": 20.53,
    "birds_animals": 5.98,
    "stalks_fallen": 11.46,
    "harvesting_damage": 1.52,
    "transport": 0.81,
    "storage": 3.68,
    "processing": 1.53,
    "packaging": 0.12,
    "sale": 1.45
  },
  "Gisagara": {
    "theft": 52.08,
    "insects_pests": 20.74,
    "birds_animals": 4.66,
    "stalks_fallen": 14.48,
    "harvesting_damage": 3.23,
    "transport": 1.33,
    "storage": -0.05,
    "processing": 2.57,
    "packaging": 0.65,
    "sale": 0.31
  },
  "Nyaruguru": {
    "theft": 16.46,
    "insects_pests": 18.88,
    "birds_animals": 60.46,
    "stalks_fallen": 3.22,
    "harvesting_damage": 0.43,
    "transport": 0.21,
    "storage": 0.02,
    "processing": 0.32,
    "packaging": 0.01,
    "sale": 0.01
  },
  "Huye": {
    "theft": 36.63,
    "insects_pests": 24.47,
    "birds_animals": 4.45,
    "stalks_fallen": 30.15,
    "harvesting_damage": 1.96,
    "transport": 0.44,
    "storage": 0.19,
    "processing": 0.9,
    "packaging": 0.71,
    "sale": 0.09
  },
  "Nyamagabe": {
    "theft": 27.51,
    "insects_pests": 33.31,
    "birds_animals": 7.95,
    "stalks_fallen": 15.46,
    "harvesting_damage": 7.56,
    "transport": 3.02,
    "storage": 0.38,
    "processing": 4.32,
    "packaging": 0.07,
    "sale": 0.42
  },
  "Ruhango": {
    "theft": 42.1,
    "insects_pests": 11.08,
    "birds_animals": 2.05,
    "stalks_fallen": 36.76,
    "harvesting_damage": 2.79,
    "transport": 0.99,
    "storage": 3.13,
    "processing": 0.84,
    "packaging": 0.16,
    "sale": 0.1
  },
  "Muhanga": {
    "theft": 40.19,
    "insects_pests": 16.91,
    "birds_animals": 1.49,
    "stalks_fallen": 19.47,
    "harvesting_damage": 4.13,
    "transport": 1.53,
    "storage": 15.13,
    "processing": 0.86,
    "packaging": 0.04,
    "sale": 0.24
  },
  "Kamonyi": {
    "theft": 43.45,
    "insects_pests": 21.86,
    "birds_animals": 1.66,
    "stalks_fallen": 15.94,
    "harvesting_damage": 3.95,
    "transport": 2.23,
    "storage": 3.32,
    "processing": 4.24,
    "packaging": 2.1,
    "sale": 1.24
  },
  "Karongi": {
    "theft": 43.72,
    "insects_pests": 17.92,
    "birds_animals": 6.37,
    "stalks_fallen": 20.51,
    "harvesting_damage": 1.21,
    "transport": 1.24,
    "storage": 4.2,
    "processing": 2.8,
    "packaging": 1.02,
    "sale": 1.01
  },
  "Rubavu": {
    "theft": 65.69,
    "insects_pests": 7.96,
    "birds_animals": 4.8,
    "stalks_fallen": 8.72,
    "harvesting_damage": 2.16,
    "transport": 7.37,
    "storage": 1.41,
    "processing": 1.16,
    "packaging": 0.58,
    "sale": 0.16
  },
  "Rusizi": {
    "theft": 53.71,
    "insects_pests": 10.99,
    "birds_animals": 2.33,
    "stalks_fallen": 8.59,
    "harvesting_damage": 3.52,
    "transport": 0.82,
    "storage": 0.11,
    "processing": 10.78,
    "packaging": 7.4,
    "sale": 1.76
  },
  "Nyamasheke": {
    "theft": 24.63,
    "insects_pests": 33.44,
    "birds_animals": 15.29,
    "stalks_fallen": 21.52,
    "harvesting_damage": 1.42,
    "transport": 0.97,
    "storage": 1.5,
    "processing": 0.88,
    "packaging": 0.09,
    "sale": 0.26
  },
  "Rulindo": {
    "theft": 15.99,
    "insects_pests": 29.55,
    "birds_animals": 4.82,
    "stalks_fallen": 21.31,
    "harvesting_damage": 12.19,
    "transport": 4.66,
    "storage": 7.37,
    "processing": 2.49,
    "packaging": 0.49,
    "sale": 1.14
  },
  "Gakenke": {
    "theft": 34.43,
    "insects_pests": 25.15,
    "birds_animals": 3.41,
    "stalks_fallen": 28.83,
    "harvesting_damage": 1.37,
    "transport": 1.03,
    "storage": 3.01,
    "processing": 1.75,
    "packaging": 0.79,
    "sale": 0.24
  },
  "Musanze": {
    "theft": 29.97,
    "insects_pests": 22.85,
    "birds_animals": 12.0,
    "stalks_fallen": 21.22,
    "harvesting_damage": 3.85,
    "transport": 4.97,
    "storage": 1.67,
    "processing": 1.87,
    "packaging": 0.36,
    "sale": 1.26
  },
  "Gicumbi": {
    "theft": 36.34,
    "insects_pests": 29.26,
    "birds_animals": 6.34,
    "stalks_fallen": 13.99,
    "harvesting_damage": 5.71,
    "transport": 3.68,
    "storage": 1.43,
    "processing": 2.22,
    "packaging": 0.63,
    "sale": 0.4
  },
  "Rwamagana": {
    "theft": 39.99,
    "insects_pests": 5.98,
    "birds_animals": 2.08,
    "stalks_fallen": 35.48,
    "harvesting_damage": 9.28,
    "transport": 0.73,
    "storage": -0.0,
    "processing": 2.68,
    "packaging": 0.42,
    "sale": 3.35
  },
  "Nyagatare": {
    "theft": 34.21,
    "insects_pests": 14.37,
    "birds_animals": 12.71,
    "stalks_fallen": 21.1,
    "harvesting_damage": 5.83,
    "transport": 1.54,
    "storage": 1.16,
    "processing": 8.32,
    "packaging": 0.39,
    "sale": 0.37
  },
  "Gatsibo": {
    "theft": 51.33,
    "insects_pests": 15.88,
    "birds_animals": 2.55,
    "stalks_fallen": 20.33,
    "harvesting_damage": 5.15,
    "transport": 1.24,
    "storage": 0.11,
    "processing": 2.84,
    "packaging": 0.26,
    "sale": 0.31
  },
  "Kayonza": {
    "theft": 44.66,
    "insects_pests": 21.02,
    "birds_animals": 5.63,
    "stalks_fallen": 17.29,
    "harvesting_damage": 5.96,
    "transport": 1.15,
    "storage": 0.5,
    "processing": 3.43,
    "packaging": 0.17,
    "sale": 0.19
  },
  "Kirehe": {
    "theft": 39.77,
    "insects_pests": 23.86,
    "birds_animals": 2.87,
    "stalks_fallen": 20.78,
    "harvesting_damage": 7.46,
    "transport": 1.27,
    "storage": 0.42,
    "processing": 2.79,
    "packaging": 0.36,
    "sale": 0.42
  },
  "Ngoma": {
    "theft": 2.43,
    "insects_pests": 95.71,
    "birds_animals": 0.13,
    "stalks_fallen": 1.31,
    "harvesting_damage": 0.14,
    "transport": 0.05,
    "storage": 0.02,
    "processing": 0.17,
    "packaging": 0.03,
    "sale": 0.03
  },
  "Bugesera": {
    "theft": 39.19,
    "insects_pests": 22.01,
    "birds_animals": 5.78,
    "stalks_fallen": 17.38,
    "harvesting_damage": 5.6,
    "transport": 1.27,
    "storage": 1.23,
    "processing": 6.97,
    "packaging": 0.3,
    "sale": 0.27
  },
  "Nyarugenge": {
    "theft": 34.57,
    "insects_pests": 13.6,
    "birds_animals": 1.66,
    "stalks_fallen": 37.15,
    "harvesting_damage": 1.04,
    "transport": 1.99,
    "storage": 6.52,
    "processing": 2.64,
    "packaging": 0.67,
    "sale": 0.15
  },
  "Rutsiro": {
    "theft": 42.74,
    "insects_pests": 17.92,
    "birds_animals": 7.34,
    "stalks_fallen": 15.91,
    "harvesting_damage": 4.04,
    "transport": 1.41,
    "storage": 8.61,
    "processing": 1.83,
    "packaging": 0.12,
    "sale": 0.08
  },
  "Nyabihu": {
    "theft": 32.65,
    "insects_pests": 24.52,
    "birds_animals": 7.47,
    "stalks_fallen": 2.54,
    "harvesting_damage": 2.07,
    "transport": 5.28,
    "storage": 3.43,
    "processing": 0.28,
    "packaging": 18.37,
    "sale": 3.39
  },
  "Ngororero": {
    "theft": 30.68,
    "insects_pests": 31.83,
    "birds_animals": 2.51,
    "stalks_fallen": 18.23,
    "harvesting_damage": 2.89,
    "transport": 0.92,
    "storage": 9.47,
    "processing": 2.59,
    "packaging": 0.4,
    "sale": 0.47
  },
  "Burera": {
    "theft": 28.52,
    "insects_pests": 38.26,
    "birds_animals": 14.96,
    "stalks_fallen": 8.79,
    "harvesting_damage": 5.99,
    "transport": 1.99,
    "storage": 0.52,
    "processing": 0.52,
    "packaging": 0.1,
    "sale": 0.34
  }
};

export const CAUSE_METADATA = {
  "insects_pests": {
    "name": "Insects & Pests",
    "share": 63.4,
    "icon": "Bug",
    "threatLevel": "Critical",
    "primaryCrops": ["Maize", "Bush bean", "Climbing bean", "Sorghum"],
    "hotspotDistricts": ["Ngoma", "Nyabihu", "Gatsibo", "Bugesera"],
    "actionAdvice": "Deploy hermetic multi-layer storage bags (PICS), solar grain drying before bagging, and certified bio-dusting for bruchids and weevils."
  },
  "theft": {
    "name": "Theft (Field & Barn)",
    "share": 18.2,
    "icon": "ShieldAlert",
    "threatLevel": "High",
    "primaryCrops": ["Banana for beer", "Irish potato", "Cassava"],
    "hotspotDistricts": ["Gatsibo", "Rusizi", "Ngoma", "Rwamagana"],
    "actionAdvice": "Establish cooperative community watch rotas, install locked communal aggregation stores, and synchronize early morning harvest collections."
  },
  "stalks_fallen": {
    "name": "Stalks Fallen / Ground Fall",
    "share": 8.3,
    "icon": "TrendingDown",
    "threatLevel": "Moderate",
    "primaryCrops": ["Maize", "Sorghum", "Banana for beer"],
    "hotspotDistricts": ["Kamonyi", "Muhanga", "Huye", "Nyanza"],
    "actionAdvice": "Improve harvest scheduling before pre-season downpours, adopt lodging-resistant crop varieties, and train on proper cutting height."
  },
  "birds_animals": {
    "name": "Birds & Wild Animals",
    "share": 3.8,
    "icon": "Bird",
    "threatLevel": "Moderate",
    "primaryCrops": ["Paddy rice", "Wheat", "Sorghum"],
    "hotspotDistricts": ["Bugesera", "Nyagatare", "Kirehe", "Rwamagana"],
    "actionAdvice": "Install protective field netting and reflective scare-tapes across vulnerable grain ripening stages; seal storage roofs against rodents."
  },
  "harvesting_damage": {
    "name": "Harvesting Damage",
    "share": 1.9,
    "icon": "Scissors",
    "threatLevel": "Low-Moderate",
    "primaryCrops": ["Irish potato", "Sweet potato", "Cassava"],
    "hotspotDistricts": ["Gatsibo", "Nyagatare", "Rulindo", "Musanze"],
    "actionAdvice": "Train harvesters on rounded spade digging technique to eliminate skin lacerations that invite bacterial soft rots."
  },
  "processing": {
    "name": "Processing Losses",
    "share": 1.5,
    "icon": "Cog",
    "threatLevel": "Low-Moderate",
    "primaryCrops": ["Paddy rice", "Maize", "Coffee"],
    "hotspotDistricts": ["Bugesera", "Rwamagana", "Buringa", "Rusizi"],
    "actionAdvice": "Calibrate mechanical grain threshers and maize shellers to reduce kernel cracking and breakage below 2%."
  },
  "storage": {
    "name": "Storage Spoilage & Decay",
    "share": 1.1,
    "icon": "Warehouse",
    "threatLevel": "High (Localized)",
    "primaryCrops": ["Irish potato", "Maize", "Fruits"],
    "hotspotDistricts": ["Ngororero", "Rutsiro", "Muhanga", "Musanze"],
    "actionAdvice": "Install raised slatted wooden drying platforms (cribs), introduce palletized stacking, and enforce strict 13.5% moisture cutoff before storage."
  },
  "transport": {
    "name": "Transport & Handling Damage",
    "share": 0.8,
    "icon": "Truck",
    "threatLevel": "High (Horticulture)",
    "primaryCrops": ["Fruits", "Dessert banana", "Vegetables"],
    "hotspotDistricts": ["Nyabihu", "Rubavu", "Musanze", "Gicumbi"],
    "actionAdvice": "Shift from overstuffed woven polypropylene sacks to rigid returnable plastic crates (RPCs) along mountain feeder roads."
  },
  "packaging": {
    "name": "Packaging & Bagging Failure",
    "share": 0.8,
    "icon": "Package",
    "threatLevel": "Low",
    "primaryCrops": ["Vegetables", "Fruits", "Irish potato"],
    "hotspotDistricts": ["Musanze", "Nyabihu", "Gasabo"],
    "actionAdvice": "Standardize packaging weights to 50kg bags to avoid burst seams and pressure bruising during truck loading."
  },
  "sale": {
    "name": "Point-of-Sale Market Spoilage",
    "share": 0.4,
    "icon": "Store",
    "threatLevel": "Low",
    "primaryCrops": ["Vegetables", "Fruits", "Cooking banana"],
    "hotspotDistricts": ["Gasabo", "Kicukiro", "Nyarugenge"],
    "actionAdvice": "Contract pre-arranged off-taker purchase agreements with agro-processors and schools to eliminate wholesale market holding days."
  }
};
