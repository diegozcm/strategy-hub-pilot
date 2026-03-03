import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Target, Linkedin, Instagram, Mail, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

interface FooterLink {
  title: string;
  href: string;
  external?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface FooterColumn {
  label: string;
  links: FooterLink[];
}

const footerColumns: FooterColumn[] = [
  {
    label: 'Produto',
    links: [
      { title: 'Funcionalidades', href: '#servicos' },
      { title: 'Plataforma', href: '#plataforma' },
      { title: 'Novidades', href: '/releases' },
    ],
  },
  {
    label: 'Empresa',
    links: [
      { title: 'FAQ', href: '#faq' },
      { title: 'Sobre a COFOUND', href: 'https://cofound.com.br', external: true },
      { title: 'Política de Privacidade', href: '/privacy' },
      { title: 'Termos de Uso', href: '/terms' },
    ],
  },
  {
    label: 'Contato',
    links: [
      { title: 'leonardo@cofound.com.br', href: 'mailto:leonardo@cofound.com.br', icon: Mail, external: true },
      { title: '+55 47 9634-2353', href: 'https://wa.me/554796342353', icon: MessageCircle, external: true },
    ],
  },
  {
    label: 'Redes Sociais',
    links: [
      { title: 'LinkedIn', href: 'https://www.linkedin.com/company/cofoundbr/', icon: Linkedin, external: true },
      { title: 'Instagram', href: 'https://instagram.com/cofoundbr', icon: Instagram, external: true },
    ],
  },
];

function AnimatedContainer({ className, delay = 0.1, children }: { delay?: number; className?: string; children: ReactNode }) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const FooterSection: React.FC<Props> = ({ getContent }) => (
  <footer className="bg-[#071520] border-t border-white/[0.05]">
    <div className="container mx-auto px-4 py-16 lg:py-20">
      {/* Large brand heading */}
      <AnimatedContainer delay={0.05}>
        <Link to="/" className="inline-flex items-center gap-3 mb-14">
          <Target className="h-8 w-8 text-cofound-blue-light" />
          <span className="text-3xl lg:text-4xl font-display font-bold text-white tracking-tight">
            Strategy HUB
          </span>
        </Link>
      </AnimatedContainer>

      {/* Columns grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:gap-16 mb-14">
        {footerColumns.map((section, index) => (
          <AnimatedContainer key={section.label} delay={0.1 + index * 0.08}>
            <h3 className="font-display font-semibold text-white text-sm mb-5 tracking-wide">
              {section.label}
            </h3>
            <ul className="space-y-3 font-sans text-sm">
              {section.links.map((link) => {
                const content = (
                  <span className="inline-flex items-center gap-2">
                    {link.icon && <link.icon className="h-4 w-4 flex-shrink-0" />}
                    {link.title}
                  </span>
                );

                const cls = "text-white/35 hover:text-white transition-colors";

                if (link.external) {
                  return (
                    <li key={link.title}>
                      <a href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                        {content}
                      </a>
                    </li>
                  );
                }

                if (link.href.startsWith('#')) {
                  return (
                    <li key={link.title}>
                      <a href={link.href} className={cls}>{content}</a>
                    </li>
                  );
                }

                return (
                  <li key={link.title}>
                    <Link to={link.href} className={cls}>{content}</Link>
                  </li>
                );
              })}
            </ul>
          </AnimatedContainer>
        ))}
      </div>

      {/* Copyright bar */}
      <AnimatedContainer delay={0.5}>
        <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-xs font-sans">
            © {new Date().getFullYear()} COFOUND. Todos os direitos reservados.
          </p>
          <a
            href="https://app.cofound.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/25 text-xs font-sans hover:text-white/50 transition-colors"
          >
            app.cofound.com.br
          </a>
        </div>
      </AnimatedContainer>
    </div>
  </footer>
);
