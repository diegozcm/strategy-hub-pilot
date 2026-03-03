import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicyPage = () => (
  <div className="min-h-screen bg-[#071520] text-white">
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-10">
        <ArrowLeft className="h-4 w-4" /> Voltar ao início
      </Link>
      <h1 className="text-3xl lg:text-4xl font-display font-bold mb-8">Política de Privacidade</h1>
      <div className="prose prose-invert prose-sm max-w-none font-sans text-white/60 space-y-6">
        <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
        <section>
          <h2 className="text-lg font-display font-semibold text-white/80">1. Coleta de Dados</h2>
          <p>Conteúdo da política de privacidade será adicionado em breve.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-white/80">2. Uso dos Dados</h2>
          <p>Conteúdo será adicionado em breve.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-white/80">3. Compartilhamento</h2>
          <p>Conteúdo será adicionado em breve.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-white/80">4. Segurança</h2>
          <p>Conteúdo será adicionado em breve.</p>
        </section>
        <section>
          <h2 className="text-lg font-display font-semibold text-white/80">5. Contato</h2>
          <p>Em caso de dúvidas, entre em contato pelo e-mail: <a href="mailto:leonardo@cofound.com.br" className="text-cofound-blue-light hover:underline">leonardo@cofound.com.br</a></p>
        </section>
      </div>
    </div>
  </div>
);

export default PrivacyPolicyPage;
