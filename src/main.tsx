import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('🚀 Starting application...');
try {
  createRoot(document.getElementById("root")!).render(<App />);
  console.log('✅ Application rendered successfully');
} catch (error) {
  console.error('❌ Application failed to render:', error);
  // Show basic error page
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
        <div style="text-align: center;">
          <h1>Erro de Aplicação</h1>
          <p>Houve um problema ao carregar a aplicação. Tente recarregar a página.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">Recarregar</button>
        </div>
      </div>
    `;
  }
}
