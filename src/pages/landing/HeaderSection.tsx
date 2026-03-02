import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HeaderSection: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-cofound-blue-dark/95 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-5'}`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-7 w-7 text-cofound-blue-light" />
          <div className="flex flex-col leading-none">
            <span className="text-xl font-display font-bold text-white">Strategy HUB</span>
            <span className="text-[10px] text-white/50 font-sans tracking-wide">by COFOUND</span>
          </div>
        </div>

        {/* Desktop nav — pill style */}
        <nav className="hidden md:flex items-center bg-white/[0.06] backdrop-blur-sm rounded-full px-2 py-1.5 border border-white/10">
          <a href="#proposta" className="text-white/70 hover:text-white transition-colors font-sans text-sm px-4 py-1.5 rounded-full hover:bg-white/10">Proposta</a>
          <a href="#plataforma" className="text-white/70 hover:text-white transition-colors font-sans text-sm px-4 py-1.5 rounded-full hover:bg-white/10">Plataforma</a>
          <a href="#servicos" className="text-white/70 hover:text-white transition-colors font-sans text-sm px-4 py-1.5 rounded-full hover:bg-white/10">Serviços</a>
          <a href="#faq" className="text-white/70 hover:text-white transition-colors font-sans text-sm px-4 py-1.5 rounded-full hover:bg-white/10">FAQ</a>
          <Link to="/releases" className="text-white/70 hover:text-white transition-colors font-sans text-sm px-4 py-1.5 rounded-full hover:bg-white/10">Novidades</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <Button className="bg-cofound-green text-cofound-blue-dark font-semibold hover:bg-cofound-green/90 rounded-full px-6 transition-all">
              Começar
            </Button>
          </Link>
          <button className="md:hidden text-white" onClick={() => setOpen(!open)}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="md:hidden bg-cofound-blue-dark/95 backdrop-blur-md border-t border-white/10 px-4 py-4 space-y-3">
          <a href="#proposta" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Proposta</a>
          <a href="#plataforma" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Plataforma</a>
          <a href="#servicos" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Serviços</a>
          <a href="#faq" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">FAQ</a>
          <Link to="/releases" onClick={() => setOpen(false)} className="block text-white/70 hover:text-white font-sans text-sm">Novidades</Link>
        </nav>
      )}
    </header>
  );
};
