import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Target, Equal, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const menuItems = [
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

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuState ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuState]);

  return (
    <header>
      <nav className="fixed z-20 w-full px-2">
        <div
          className={cn(
            'mx-auto mt-2 px-6 transition-all duration-300 lg:px-12',
            isScrolled
              ? 'bg-cofound-blue-dark/80 max-w-5xl rounded-2xl backdrop-blur-md lg:px-8'
              : 'max-w-full'
          )}
        >
          <div className="relative flex items-center justify-between py-3 md:py-4">
            {/* Logo */}
            <Link
              to="/"
              aria-label="home"
              className="flex items-center space-x-2 relative z-30"
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

            {/* Desktop nav */}
            <div className="hidden lg:flex lg:items-center lg:gap-8">
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

              {/* Desktop CTA */}
              <div className="flex gap-3">
                <Link to="/auth">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white px-5"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button
                    size="sm"
                    className="rounded-full bg-cofound-green text-cofound-blue-dark font-semibold hover:bg-cofound-green/90 px-5"
                  >
                    Começar Agora
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuState(!menuState)}
              aria-label={menuState ? 'Close Menu' : 'Open Menu'}
              className="relative z-30 -m-2.5 block cursor-pointer p-2.5 lg:hidden"
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
        </div>

        {/* Mobile menu overlay */}
        <AnimatePresence>
          {menuState && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="lg:hidden absolute top-0 left-0 right-0 px-2 pt-2"
            >
              <div className="bg-cofound-blue-dark/95 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                {/* Menu header with logo + close */}
                <div className="flex items-center justify-between px-6 py-4">
                  <Link
                    to="/"
                    onClick={() => setMenuState(false)}
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
                    onClick={() => setMenuState(false)}
                    className="p-2 -mr-2"
                    aria-label="Close Menu"
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>

                {/* Links */}
                <div className="px-6 pb-2">
                  <ul className="space-y-1">
                    {menuItems.map((item, i) => (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 + i * 0.06 }}
                      >
                        {item.isRoute ? (
                          <Link
                            to={item.href}
                            onClick={() => setMenuState(false)}
                            className="block py-3 text-base font-sans font-medium text-white/80 hover:text-white transition-colors"
                          >
                            {item.name}
                          </Link>
                        ) : (
                          <a
                            href={item.href}
                            onClick={() => setMenuState(false)}
                            className="block py-3 text-base font-sans font-medium text-white/80 hover:text-white transition-colors"
                          >
                            {item.name}
                          </a>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* CTA buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.25 }}
                  className="px-6 pb-6 pt-3 flex flex-col gap-3"
                >
                  <Link to="/auth" onClick={() => setMenuState(false)} className="w-full">
                    <Button
                      variant="outline"
                      className="rounded-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white w-full h-11 text-sm font-medium"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth" onClick={() => setMenuState(false)} className="w-full">
                    <Button
                      className="rounded-full bg-cofound-green text-cofound-blue-dark font-semibold hover:bg-cofound-green/90 w-full h-11 text-sm"
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
