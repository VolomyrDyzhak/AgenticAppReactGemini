import { useState } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import './App.css';

interface Recipe {
  id: number;
  name: string;
  description: string;
  instructions: string;
  difficulty: string;
  time: string;
  calories: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const INGREDIENTS = [
  "Huevos", "Leche", "Harina", "Tomate", "Pollo", 
  "Arroz", "Cebolla", "Ajo", "Pasta", "Queso", 
  "Patatas", "Espinacas", "Aguacate", "Limón",
  "Harina de almendras", "Azúcar glass", "Agua", 
  "Chocolate negro", "Chocolate blanco", "Colorante", 
  "Mantequilla", "Sal", "Vainilla"
];

export default function App() {
  const [view, setView] = useState<'picker' | 'results' | 'detail'>('picker');
  const [selected, setSelected] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = (item: string) => {
    setSelected(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  };

 const generateRecipes = async () => {
  if (selected.length === 0) return;
  setIsLoading(true);
  setView('results');

  const prompt = `Genera un JSON array de 3 recetas con: ${selected.join(", ")}. 
  Formato: [{"id": 1, "name": "...", "description": "...", "instructions": "...", "difficulty": "Fácil", "time": "20 min", "calories": "300 kcal"}]`;

  try {
    console.log("🚀 Lanzando petición a Gemini 2.0 Flash...");
    
    // Usamos el modelo que ya te aceptó la conexión
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite-preview" });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanJson = jsonMatch ? jsonMatch[0] : text;
    
    setRecipes(JSON.parse(cleanJson));
    console.log("✅ ¡ÉXITO TOTAL!");

  } catch (err: any) {
    if (err.message.includes("429")) {
      alert("⏳ El Chef está saturado. Espera 30 segundos y vuelve a intentarlo, ¡ya casi lo tienes!");
    } else {
      console.error("Error inesperado:", err.message);
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">Chef<span>OS</span></div>
        <div className="badge">Agentic Engine v1.0</div>
      </nav>

      {view === 'picker' && (
        <div className="view-container fade-in">
          <div className="text-center">
            <h2 className="title">Generador de Recetas Agéntico</h2>
            <p className="subtitle">Selecciona tus ingredientes y la IA diseñará un menú de alta cocina para ti.</p>
          </div>
          
          <div className="ingredient-grid">
            {INGREDIENTS.map(item => (
              <button 
                key={item} 
                className={`ingredient-card ${selected.includes(item) ? 'selected' : ''}`}
                onClick={() => toggleItem(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="action-bar">
            <button 
              className="btn-primary" 
              onClick={generateRecipes} 
              disabled={selected.length === 0}
            >
              GENERAR MENÚ IA
            </button>
          </div>
        </div>
      )}

      {view === 'results' && (
        <div className="view-container fade-in">
          {isLoading ? (
            <div className="skeleton-loader">
              <div className="spinner-chef"></div>
              <p>El Chef está razonando tu menú...</p>
            </div>
          ) : (
            <>
              <div className="recipe-grid">
                {recipes.map(r => (
                  <div 
                    key={r.id} 
                    className="recipe-card-modern" 
                    onClick={() => { setCurrentRecipe(r); setView('detail'); }}
                  >
                    <div className="recipe-info">
                      <span className="recipe-meta">{r.time} • {r.calories}</span>
                      <h3>{r.name}</h3>
                      <p>{r.description}</p>
                      <div className="difficulty-tag">{r.difficulty}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <button className="btn-secondary" onClick={() => setView('picker')}>
                  Modificar ingredientes
                </button>
              </div>
            </>
          )}
        </div>
      )}

     {view === 'detail' && currentRecipe && (
  <div className="view-container fade-in">
    <div className="detail-card">
      <div className="detail-actions">
        <button className="btn-back" onClick={() => setView('results')}>← Volver al menú</button>
        {/* Este es el nuevo botón para volver al principio */}
        <button className="btn-secondary-mini" onClick={() => {
          setSelected([]); // Limpiamos ingredientes
          setRecipes([]);  // Limpiamos recetas
          setView('picker'); // Volvemos al inicio
        }}>Nueva Creación 🔄</button>
      </div>

      <div className="detail-header">
        <h2>{currentRecipe.name}</h2>
        <div className="detail-tags">
          <span>⏱️ {currentRecipe.time}</span>
          <span>🔥 {currentRecipe.calories}</span>
          <span>📊 {currentRecipe.difficulty}</span>
        </div>
      </div>
      <div className="detail-content">
        <h3>Instrucciones del Chef</h3>
        <p>{currentRecipe.instructions}</p>
      </div>
    </div>
  </div>
)}
    </div>
  );
}