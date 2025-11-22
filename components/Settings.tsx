
import React, { useState } from 'react';
import { UserSettings, HealthLevel, DEFAULT_CATEGORIES, TransactionType } from '../types';
import { Plus, X, Save, RefreshCcw } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import SegmentedControl from './ui/SegmentedControl';
import { getColorClasses, colorMap, ColorName } from '../styles/tokens';

interface SettingsProps {
  settings: UserSettings;
  onSaveSettings: (s: UserSettings) => void;
}

const AVAILABLE_COLORS: ColorName[] = [
  'rose', 'orange', 'amber', 'yellow', 'lime', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'slate'
];

const Settings: React.FC<SettingsProps> = ({ settings, onSaveSettings }) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);
  const [activeTab, setActiveTab] = useState<'categories' | 'health'>('categories');
  const [newCatName, setNewCatName] = useState('');
  const [catType, setCatType] = useState<TransactionType>('expense');

  // Keep local state in sync when settings prop changes (e.g., after fetch/save)
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    setLocalSettings(prev => ({
      ...prev,
      customCategories: {
        ...prev.customCategories,
        [catType]: [...prev.customCategories[catType], newCatName]
      }
    }));
    setNewCatName('');
  };

  const handleRemoveCategory = (type: TransactionType, name: string) => {
    if (confirm(`Remover categoria "${name}"?`)) {
      setLocalSettings(prev => ({
        ...prev,
        customCategories: {
          ...prev.customCategories,
          [type]: prev.customCategories[type].filter(c => c !== name)
        }
      }));
    }
  };

  const handleUpdateHealthLevel = (index: number, field: keyof HealthLevel, value: any) => {
    const newLevels = [...localSettings.healthLevels];
    newLevels[index] = { ...newLevels[index], [field]: value };
    setLocalSettings({ ...localSettings, healthLevels: newLevels });
  };

  const handleResetDefaults = () => {
    if(confirm("Restaurar padrões? Isso apagará suas categorias personalizadas.")) {
      setLocalSettings({
        ...settings,
        customCategories: DEFAULT_CATEGORIES
      });
    }
  }

  const save = () => {
    onSaveSettings(localSettings);
  }

  const categoryTypeOptions = [
    { id: 'income', label: 'Entradas' },
    { id: 'expense', label: 'Saídas' },
    { id: 'daily', label: 'Diário' },
    { id: 'economy', label: 'Economia' }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
          <p className="text-slate-500">Personalize a experiência do aplicativo.</p>
        </div>
        <Button
          variant="secondary"
          icon={<Save size={18} />}
          onClick={save}
        >
          Salvar Alterações
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-4 px-4 font-bold text-sm transition-all ${activeTab === 'categories' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Categorias
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`pb-4 px-4 font-bold text-sm transition-all ${activeTab === 'health' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Níveis de Saúde
        </button>
      </div>

      {/* Categories Editor */}
      {activeTab === 'categories' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
          <Card variant="elevated">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <h3 className="font-bold text-lg text-slate-800">Gerenciar Categorias</h3>
              <SegmentedControl
                options={categoryTypeOptions}
                value={catType}
                onChange={(val) => setCatType(val as TransactionType)}
              />
            </div>

            <div className="flex gap-2 mb-6">
              <Input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder={`Nova categoria de ${catType}...`}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              />
              <Button
                variant="primary"
                icon={<Plus size={20} />}
                onClick={handleAddCategory}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {localSettings.customCategories[catType].map(cat => (
                <div key={cat} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-full group hover:border-slate-300 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{cat}</span>
                  <button onClick={() => handleRemoveCategory(catType, cat)} className="p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button onClick={handleResetDefaults} className="text-sm text-slate-400 hover:text-rose-600 flex items-center gap-2 transition-colors">
                <RefreshCcw size={14} /> Restaurar categorias padrão
              </button>
            </div>
          </Card>

          {/* Botão extra no fim para facilitar o salvamento em telas menores */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              icon={<Save size={18} />}
              onClick={save}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {/* Health Levels Editor */}
      {activeTab === 'health' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          <Card variant="default" className="bg-blue-50 border-blue-200">
            <p className="text-blue-800 text-sm">
              Defina os intervalos de saldo para colorir seus gráficos e alertas. Use <strong>vazio</strong> para representar infinito.
            </p>
          </Card>

          <div className="grid gap-4">
            {localSettings.healthLevels.map((level, idx) => {
              const colorClasses = getColorClasses(level.color);

              return (
                <Card key={level.id} variant="elevated" className="flex flex-col md:flex-row items-center gap-4">
                  <div className={`w-4 h-full min-h-[48px] rounded-lg ${colorClasses.bgSolid} flex-shrink-0`}></div>

                  <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Nome do Nível</label>
                      <input
                        type="text"
                        value={level.label}
                        onChange={e => handleUpdateHealthLevel(idx, 'label', e.target.value)}
                        className="w-full font-bold text-slate-700 bg-transparent outline-none border-b border-transparent focus:border-slate-300 py-1 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Mínimo (R$)</label>
                      <input
                        type="number"
                        value={level.min === null ? '' : level.min}
                        onChange={e => handleUpdateHealthLevel(idx, 'min', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="-∞"
                        className="w-full font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Máximo (R$)</label>
                      <input
                        type="number"
                        value={level.max === null ? '' : level.max}
                        onChange={e => handleUpdateHealthLevel(idx, 'max', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="+∞"
                        className="w-full font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded outline-none focus:ring-2 focus:ring-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Cor</label>
                      <div className="flex gap-1 flex-wrap">
                        {AVAILABLE_COLORS.map(c => {
                          const cClasses = getColorClasses(c);
                          return (
                            <button
                              key={c}
                              onClick={() => handleUpdateHealthLevel(idx, 'color', c)}
                              className={`w-5 h-5 rounded-full ${cClasses.bgSolid} transition-all ${level.color === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'opacity-40 hover:opacity-100'}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-end">
            <Button
              variant="secondary"
              icon={<Save size={18} />}
              onClick={save}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {/* Botão flutuante sempre visível para salvar (útil em telas menores ou após rolagem longa) */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          variant="primary"
          icon={<Save size={18} />}
          onClick={save}
          className="shadow-lg shadow-indigo-500/20"
        >
          Salvar
        </Button>
      </div>
    </div>
  );
};

export default Settings;
