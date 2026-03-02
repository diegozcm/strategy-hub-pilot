import React from 'react';
import { Target, Linkedin, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Props {
  getContent: (s: string, k: string, f?: string) => string;
}

export const FooterSection: React.FC<Props> = ({ getContent }) => (
  <footer className="bg-[#091A2A] border-t border-white/5">
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-6 w-6 text-cofound-blue-light" />
            <span className="text-xl font-display font-bold text-white">Strategy HUB</span>
          </div>
          <p className="text-white/40 text-sm mb-4 font-sans">
            {getContent('footer', 'description', 'Impulsionando o crescimento de empresas através de estratégia, inovação e tecnologia.')}
          </p>
          <div className="flex gap-4">
            <a href={getContent('footer', 'linkedin_url', 'https://www.linkedin.com/company/cofoundbr/')} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-cofound-blue-light transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href={getContent('footer', 'instagram_url', 'https://instagram.com/cofoundbr')} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-cofound-blue-light transition-colors">
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Nav */}
        <div>
          <h3 className="font-display font-semibold text-white mb-4">Navegação</h3>
          <ul className="space-y-2 font-sans text-sm">
            <li><a href="#servicos" className="text-white/40 hover:text-white transition-colors">Serviços</a></li>
            <li><a href="#plataforma" className="text-white/40 hover:text-white transition-colors">Plataforma</a></li>
            <li><a href="#faq" className="text-white/40 hover:text-white transition-colors">FAQ</a></li>
            <li><Link to="/auth" className="text-white/40 hover:text-white transition-colors">Login</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-display font-semibold text-white mb-4">Contato</h3>
          <ul className="space-y-3 font-sans text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-white/30" />
              <a href={`mailto:${getContent('footer', 'email', 'admin@cofound.com.br')}`} className="text-white/40 hover:text-white transition-colors">
                {getContent('footer', 'email', 'admin@cofound.com.br')}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-white/30" />
              <a href={`tel:${getContent('footer', 'phone', '+5548336335549')}`} className="text-white/40 hover:text-white transition-colors">
                {getContent('footer', 'phone', '+55 48 3363-3549')}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-white/30 mt-0.5" />
              <span className="text-white/40">{getContent('footer', 'address', 'Ágora Tech Park, Joinville/SC')}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 text-center">
        <p className="text-white/30 text-sm font-sans">
          © {new Date().getFullYear()} COFOUND. Todos os direitos reservados.
        </p>
      </div>
    </div>
  </footer>
);
