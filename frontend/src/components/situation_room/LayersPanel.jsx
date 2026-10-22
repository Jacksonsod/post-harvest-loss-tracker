import React, { useState } from 'react';
import { 
  Layers, 
  Search, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Target, 
  Building2, 
  Bug, 
  Warehouse, 
  Truck,
  Check
} from 'lucide-react';

export default function LayersPanel({ layers, onToggleLayer }) {
  const [isOpen, setIsOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const layerDefinitions = [
    {
      id: 'hotspots',
      name: 'LOSS RATE HOTSPOTS',
      icon: Target,
      color: 'text-rose-600',
      description: 'Choropleth heatmap of 30 districts shaded by post-harvest loss rate'
    },
    {
      id: 'coops',
      name: 'COOPERATIVE HUBS',
      icon: Building2,
      color: 'text-cyan-600',
      description: 'Active agricultural cooperatives with harvest telemetry and radar pulse'
    },
    {
      id: 'pests',
      name: 'PEST OUTBREAK ZONES',
      icon: Bug,
      color: 'text-amber-600',
      description: 'High-risk grain weevil and bruchid corridors (Ngoma, Gatsibo, Bugesera)'
    },
    {
      id: 'storage',
      name: 'STORAGE DEFICITS',
      icon: Warehouse,
      color: 'text-purple-600',
      description: 'Districts lacking ventilated hermetic stores and raised platforms'
    },
    {
      id: 'transit',
      name: 'TRANSIT BOTTLENECK ROADS',
      icon: Truck,
      color: 'text-emerald-600',
      description: 'Steep feeder roads with >15% transit damage in fresh horticulture'
    }
  ];

  const filteredLayers = layerDefinitions.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full sm:w-72 bg-white/95 border border-slate-200 rounded-xl shadow-xl backdrop-blur-md overflow-hidden z-20">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-mono font-bold tracking-wider text-slate-800">LAYERS</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
            {Object.values(layers).filter(Boolean).length}/{layerDefinitions.length}
          </span>
        </div>
        <button className="text-slate-400 hover:text-slate-700">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-3 space-y-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search layers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-mono"
            />
          </div>

          {/* Layer Checkboxes */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {filteredLayers.map((layer) => {
              const Icon = layer.icon;
              const isChecked = !!layers[layer.id];
              return (
                <div
                  key={layer.id}
                  onClick={() => onToggleLayer(layer.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/60'
                      : 'bg-white border-slate-200 hover:bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Custom tactical checkbox */}
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-sm'
                        : 'bg-white border-slate-300'
                    }`}>
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <Icon className={`w-3.5 h-3.5 ${layer.color}`} />
                    <span className="text-[11px] font-mono font-bold tracking-tight text-slate-800">
                      {layer.name}
                    </span>
                  </div>

                  <span title={layer.description} className="text-slate-400 hover:text-slate-600">
                    <Info className="w-3.5 h-3.5" />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
