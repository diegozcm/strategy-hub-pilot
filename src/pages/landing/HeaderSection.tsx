import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeaderSection: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full bg-cofound-blue-dark/95 backdrop-blur-md border-b border-white/10 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-8 w-8 text-cofound-blue-light" />
          <div className="flex flex-col">
            <span className="text-2xl font-display font-bold text-white">Strategy HUB</span>
            <span className="text-xs text-white/60 font-sans">by COFOUND</span>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#proposta" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Proposta</a>
          <a href="#plataforma" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Plataforma</a>
          <a href="#servicos" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Serviços</a>
          <a href="#faq" className="text-white/70 hover:text-white transition-colors font-sans text-sm">FAQ</a>
          <Link to="/releases" className="text-white/70 hover:text-white transition-colors font-sans text-sm">Novidades</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button className="bg-cofound-green text-cofound-blue-dark font-semibold hover:bg-cofound-green/90 transition-all">
              Login
            </Button>
          </Link>

          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="md:hidden bg-cofound-blue-dark border-t border-white/10 px-4 py-4 space-y-3">
          <a href="#proposta" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Proposta</a>
          <a href="#plataforma" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Plataforma</a>
          <a href="#servicos" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Serviços</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">FAQ</a>
        </nav>
      )}
    </header>
  );
};
