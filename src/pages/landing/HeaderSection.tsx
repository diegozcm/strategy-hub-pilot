import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Equal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const menuItems = [
  { name: 'Proposta', href: '#proposta' },
  { name: 'Plataforma', href: '#plataforma' },
  { name: 'Serviços', href: '#servicos' },
  { name: 'FAQ', href: '#faq' },
  { name: 'Novidades', href: '/releases', isRoute: true },
];

export const HeaderSection: React.FC = () => {
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState ? 'active' : undefined}
        className="fixed z-20 w-full px-2"
      >
        <div
          className={cn(
            'mx-auto mt-2 px-6 transition-all duration-300 lg:px-12',
            isScrolled
              ? 'bg-cofound-blue-dark/80 max-w-5xl rounded-2xl backdrop-blur-md lg:px-8'
              : 'max-w-full'
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 md:gap-0 md:py-4">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                to="/"
                aria-label="home"
                className="flex items-center space-x-2"
              >
                <Target className="h-7 w-7 text-cofound-blue-light" />
                <div className="flex flex-col leading-none">
                  <span className="text-xl font-display font-bold text-white">
                    Strategy HUB
                  </span>
                  <span className="text-[10px] text-white/50 font-sans tracking-wide">
                    by COFOUND
                  </span>
                </div>
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? 'Close Menu' : 'Open Menu'}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Equal
                  className={cn(
                    'h-6 w-6 text-white transition-all duration-300',
                    menuState && 'rotate-180 scale-0 opacity-0'
                  )}
                />
                <X
                  className={cn(
                    'absolute inset-0 m-auto h-6 w-6 text-white transition-all duration-300',
                    !menuState && '-rotate-180 scale-0 opacity-0'
                  )}
                />
              </button>
            </div>

            {/* Desktop nav */}
            <div className="hidden lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item) => (
                  <li key={item.name}>
                    {item.isRoute ? (
                      <Link
                        to={item.href}
                        className="text-white/70 hover:text-white transition-colors duration-200 font-sans"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <a
                        href={item.href}
                        className="text-white/70 hover:text-white transition-colors duration-200 font-sans"
                      >
                        {item.name}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mobile menu */}
            <div
              className={cn(
                'bg-cofound-blue-dark/95 backdrop-blur-xl mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-white/10 p-6 shadow-2xl shadow-black/30 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none',
                menuState
                  ? 'visible flex opacity-100 translate-y-0'
                  : 'invisible hidden opacity-0 -translate-y-4 lg:visible lg:flex lg:opacity-100 lg:translate-y-0'
              )}
              style={{ transition: 'opacity 0.3s, transform 0.3s' }}
            >
              {/* Mobile links */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base font-medium">
                  {menuItems.map((item) => (
                    <li key={item.name}>
                      {item.isRoute ? (
                        <Link
                          to={item.href}
                          onClick={() => setMenuState(false)}
                          className="text-white/80 hover:text-white block transition-colors duration-200 font-sans"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <a
                          href={item.href}
                          onClick={() => setMenuState(false)}
                          className="text-white/80 hover:text-white block transition-colors duration-200 font-sans"
                        >
                          {item.name}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA buttons */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 lg:w-fit">
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white px-5 w-full sm:w-auto"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    size="sm"
                    className="rounded-xl bg-cofound-green text-cofound-blue-dark font-semibold hover:bg-cofound-green/90 px-5 w-full sm:w-auto"
                  >
                    Começar Agora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
