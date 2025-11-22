import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, ShieldCheck, Smartphone, BarChart3 } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu email para confirmar.');
        setMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-6 items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 backdrop-blur-2xl p-8 lg:p-10 shadow-[0_40px_120px_-50px_rgba(6,182,212,0.6)]">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-5">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 border border-white/15 rounded-full text-sm font-semibold">
              <Sparkles size={18} className="text-emerald-300" />
              Fluxo — nova identidade
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight font-['Space_Grotesk']">
                Controle financeiro com cara de 2025.
              </h1>
              <p className="text-slate-200/80 mt-3 text-lg leading-relaxed">
                Visuais em vidro fosco, cores vivas e insights claros para você decidir rápido e com mais confiança.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: <ShieldCheck size={18} />, title: 'Segurança', desc: 'Supabase Auth e criptografia.' },
                { icon: <BarChart3 size={18} />, title: 'Projeções', desc: 'Cashflow, recorrências e cartões.' },
                { icon: <Smartphone size={18} />, title: 'Responsivo', desc: 'Pronto para desktop e mobile.' },
              ].map((item) => (
                <div key={item.title} className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 text-emerald-200 font-semibold text-sm">
                    {item.icon} {item.title}
                  </div>
                  <p className="text-xs text-slate-200/80 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="w-full">
          <Card variant="default" padding="lg" className="bg-white/80 backdrop-blur-2xl text-slate-900 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acesso</p>
                <h2 className="text-2xl font-bold text-slate-900 mt-1">
                  {mode === 'login' ? 'Entrar no Fluxo' : 'Criar sua conta'}
                </h2>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={22} />
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-600 p-3 rounded-xl mb-4 text-sm flex items-center gap-2 border border-rose-200 animate-in fade-in duration-200">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {message && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl mb-4 text-sm border border-emerald-200 animate-in fade-in duration-200">
                {message}
              </div>
            )}

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-xl outline-none text-slate-800 placeholder:text-slate-400 transition-all"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border-2 border-slate-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 rounded-xl outline-none text-slate-800 placeholder:text-slate-400 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                size="lg"
                icon={!loading ? <ArrowRight size={18} /> : undefined}
                iconPosition="right"
              >
                {mode === 'login' ? 'Entrar' : 'Cadastrar'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                {mode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setMessage(null); }}
                  className="ml-2 font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
                </button>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
