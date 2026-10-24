// Static Lookups & Metadata
export const DISTRICTS = [
  "Bugesera",
  "Burera",
  "Gakenke",
  "Gasabo",
  "Gatsibo",
  "Gicumbi",
  "Gisagara",
  "Huye",
  "Kamonyi",
  "Karongi",
  "Kayonza",
  "Kicukiro",
  "Kirehe",
  "Muhanga",
  "Musanze",
  "Ngoma",
  "Ngororero",
  "Nyabihu",
  "Nyagatare",
  "Nyamagabe",
  "Nyamasheke",
  "Nyanza",
  "Nyarugenge",
  "Nyaruguru",
  "Rubavu",
  "Ruhango",
  "Rulindo",
  "Rusizi",
  "Rutsiro",
  "Rwamagana"
];

export const CROPS = [
  "Fruits",
  "Dessert banana",
  "Paddy rice",
  "Maize",
  "Banana for beer",
  "Cooking banana",
  "Climbing bean",
  "Pea",
  "Other crops",
  "Vegetables",
  "Other cereals",
  "Bush bean",
  "Irish potato",
  "Fodder crops",
  "Soybean",
  "Sorghum",
  "Wheat",
  "Cassava",
  "Groundnut",
  "Taro & Yams",
  "Sweet potato"
];

export const SEASONS = [
  { id: "A", name: "Season A", months: "Sep – Jan (Major Cereal Harvest)", color: "emerald" },
  { id: "B", name: "Season B", months: "Feb – Jun (Main Legume & Tuber Harvest)", color: "amber" },
  { id: "C", name: "Season C", months: "Jul – Aug (Marshland & Irrigated Crops)", color: "cyan" }
];

export const CAUSES_ORDER = [
  "insects_pests", "theft", "stalks_fallen", "birds_animals",
  "harvesting_damage", "processing", "storage", "transport", "packaging", "sale"
];

export const CAUSE_LABELS = {
  insects_pests: { name: "Insects & Pests", icon: "Bug", description: "Bruchids, weevils, borers, and field pests" },
  theft: { name: "Theft", icon: "ShieldAlert", description: "Crop theft from field, transit, or farm stores" },
  stalks_fallen: { name: "Fallen Stalks / Lodging", icon: "TrendingDown", description: "Stalks knocked down by wind, rain, or weak stems" },
  birds_animals: { name: "Birds & Animals", icon: "Bird", description: "Depredation by birds, rodents, and wild animals" },
  harvesting_damage: { name: "Harvesting Damage", icon: "Scissors", description: "Mechanical damage during cutting, digging, or picking" },
  processing: { name: "Processing Losses", icon: "Cog", description: "Losses during threshing, shelling, or dehusking" },
  storage: { name: "Storage Spoilage", icon: "Warehouse", description: "Rot, moisture damage, and mold in storage" },
  transport: { name: "Transport Damage", icon: "Truck", description: "Bruising and spillage during transit" },
  packaging: { name: "Packaging Losses", icon: "Package", description: "Bag tearing, poor bagging, and container leakage" },
  sale: { name: "Sale / Market Rejection", icon: "ShoppingBag", description: "Post-harvest quality rejection at market point" }
};
