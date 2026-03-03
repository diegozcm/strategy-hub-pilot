import { useEffect } from 'react';

import dashboardImg from '@/assets/screenshots/dashboard-rumo.png';
import objetivosImg from '@/assets/screenshots/objetivos-estrategicos.png';
import resultadosImg from '@/assets/screenshots/resultados-chave.png';
import atlasImg from '@/assets/screenshots/atlas-insights.png';
import ferramentasImg from '@/assets/screenshots/ferramentas-governanca.png';
import projetosImg from '@/assets/screenshots/projetos-kanban.png';
import krDetalheImg from '@/assets/screenshots/kr-detalhe.png';

const ALL_SCREENSHOTS = [
  dashboardImg,
  objetivosImg,
  resultadosImg,
  atlasImg,
  ferramentasImg,
  projetosImg,
  krDetalheImg,
];

export function usePreloadImages() {
  useEffect(() => {
    ALL_SCREENSHOTS.forEach((src) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }, []);
}
