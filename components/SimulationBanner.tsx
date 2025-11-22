import React from 'react';
import { Sparkles, X, Plus } from 'lucide-react';
import Button from './ui/Button';

interface SimulationBannerProps {
  isActive: boolean;
  onToggle: () => void;
  onAddSimulation: () => void;
}

const SimulationBanner: React.FC<SimulationBannerProps> = ({ isActive, onToggle, onAddSimulation }) => {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-64 md:right-8 z-40">
      <div className="bg-gradient-to-r from-purple-900 to-purple-800 text-white p-4 rounded-2xl shadow-2xl shadow-purple-500/20 border border-purple-700 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-purple-700/50 p-2.5 rounded-xl">
            <Sparkles className="text-purple-200" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-lg">Modo Simulação Ativo</h4>
            <p className="text-purple-200 text-sm">Adicione gastos para ver o impacto no futuro.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={<Plus size={16} />}
            onClick={onAddSimulation}
            className="bg-white text-purple-900 border-white hover:bg-purple-50"
          >
            Simular Gasto
          </Button>
          <button
            onClick={onToggle}
            className="p-2 hover:bg-purple-700/50 rounded-xl transition-colors"
          >
            <X size={20} className="text-purple-200" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationBanner;
