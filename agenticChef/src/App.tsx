import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredientsList: string;
  instructions: string;
  difficulty: string;
  time: string;
  calories: string;
  image?: string;
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const INGREDIENTS_CATEGORIZED = {
  Proteínas: [
    "Huevos",
    "Pollo",
    "Ternera",
    "Cerdo",
    "Cordero",
    "Pato",
    "Bacon",
    "Chorizo",
    "Jamón Ibérico",
    "Pavo",
    "Salmón",
    "Atún",
    "Bacalao",
    "Merluza",
    "Gambas",
    "Langostinos",
    "Mejillones",
    "Calamares",
    "Pulpo",
    "Trucha",
    "Sardinas",
    "Anchoas",
    "Cangrejo",
    "Tofu",
    "Seitán",
    "Tempeh",
  ],
  Vegetales: [
    "Tomate",
    "Cebolla",
    "Ajo",
    "Patatas",
    "Espinacas",
    "Aguacate",
    "Zanahoria",
    "Brócoli",
    "Calabacín",
    "Berenjena",
    "Pimiento Rojo",
    "Pimiento Verde",
    "Pepino",
    "Lechuga",
    "Canónigos",
    "Rúcula",
    "Coliflor",
    "Espárragos",
    "Judías Verdes",
    "Guisantes",
    "Habas",
    "Calabaza",
    "Puerro",
    "Apio",
    "Remolacha",
    "Rábano",
    "Alcachofa",
    "Champiñones",
    "Setas Shiitake",
    "Boletus",
    "Col Lombarda",
    "Repollo",
    "Kale",
    "Maíz",
    "Batata",
    "Yuca",
  ],
  "Lácteos y Despensa": [
    "Leche",
    "Queso",
    "Arroz",
    "Pasta",
    "Yogur Griego",
    "Nata para cocinar",
    "Nata para montar",
    "Queso Parmesano",
    "Queso Mozzarella",
    "Queso Feta",
    "Queso de Cabra",
    "Queso Azul",
    "Mascarpone",
    "Ricotta",
    "Cheddar",
    "Leche de Coco",
    "Leche de Avena",
    "Leche de Soja",
    "Kéfir",
    "Lentejas",
    "Garbanzos",
    "Alubias Blancas",
    "Alubias Negras",
    "Quinoa",
    "Cuscús",
    "Bulgur",
    "Avena",
  ],
  Frutas: [
    "Limón",
    "Manzana",
    "Pera",
    "Plátano",
    "Fresa",
    "Frambuesa",
    "Arándanos",
    "Mora",
    "Naranja",
    "Mandarina",
    "Lima",
    "Pomelo",
    "Piña",
    "Mango",
    "Papaya",
    "Coco",
    "Kiwis",
    "Melocotón",
    "Albaricoque",
    "Cereza",
    "Uva",
    "Higos",
    "Granada",
    "Sandía",
    "Melón",
    "Maracuyá",
  ],
  "Especias y Condimentos": [
    "Sal",
    "Pimienta Negra",
    "Pimienta Blanca",
    "Pimentón Dulce",
    "Pimentón Picante",
    "Comino",
    "Cúrcuma",
    "Curry",
    "Canela",
    "Jengibre Fresco",
    "Azafrán",
    "Orégano",
    "Albahaca",
    "Perejil",
    "Cilantro",
    "Romero",
    "Tomillo",
    "Menta",
    "Hierbabuena",
    "Laurel",
    "Aceite de Oliva Virgen Extra",
    "Salsa de Soja",
    "Vinagre Balsámico",
    "Mostaza de Dijon",
    "Tahini",
    "Pesto",
  ],
  Repostería: [
    "Harina",
    "Harina de almendras",
    "Azúcar glass",
    "Azúcar Blanco",
    "Azúcar Moreno",
    "Chocolate negro",
    "Chocolate con leche",
    "Chocolate blanco",
    "Colorante",
    "Mantequilla",
    "Vainilla",
    "Levadura Química",
    "Bicarbonato",
    "Cacao en Polvo",
    "Gelatina",
    "Miel",
    "Jarabe de Arce",
    "Leche Condensada",
    "Dulce de Leche",
  ],
  "Frutos Secos y Otros": [
    "Nueces",
    "Almendras",
    "Avellanas",
    "Pistachos",
    "Cacahuetes",
    "Anacardos",
    "Piñones",
    "Semillas de Chía",
    "Sésamo",
    "Vino Blanco",
    "Vino Tinto",
    "Cerveza",
    "Caldo de Pollo",
    "Trufa Negra",
    "Alga Nori",
  ],
};

export default function App() {
  const [view, setView] = useState<"picker" | "results" | "detail">("picker");
  const [selected, setSelected] = useState<string[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleItem = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const generateRecipes = async () => {
    if (selected.length === 0) return;
    setIsLoading(true);
    setView("results");

    // We ask the AI to provide a 'searchQuery' property with keywords for the image
    const prompt = `Act as a Michelin-star Executive Chef. Your goal is to generate 5 highly detailed, creative, and professional recipes based ONLY on these available ingredients: ${selected.join(", ")}.

OUTPUT FORMAT:
You must respond ONLY with a valid JSON array. Each object in the array must follow this structure:
{
  "id": number,
  "name": "Creative Gourmet Name",
  "description": "A sophisticated one-sentence description of the dish.",
  "ingredientsList": "Ingredients\\n- [Quantity] [Ingredient Name] (e.g., 100g NESTLÉ Dark Chocolate)\\n- [Quantity] [Ingredient Name]...",
  "instructions": "Preparation\\n1. [Detailed Step]\\n2. [Detailed Step]...",
  "difficulty": "Easy | Medium | Hard",
  "time": "Duration (e.g., 45 min)",
  "calories": "Estimated calories (e.g., 350 kcal)"
}

STRICT STYLE RULES:
1. "ingredientsList" MUST include precise measurements and brand-name suggestions (like 'NESTLÉ', 'IDEAL', etc.) for a premium feel.
2. "instructions" MUST be comprehensive, including oven temperatures (Celsius), specific techniques (e.g., 'au bain-marie', 'stiff peaks'), and resting times.
3. Use '\\n' for line breaks within strings to ensure proper formatting in the UI.
4. Language: The content (names, descriptions, instructions) must be written in SPANISH.
5. Do not include markdown code blocks (like \`\`\`json). Only the raw JSON array.`;

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const startIndex = text.indexOf("[");
      const endIndex = text.lastIndexOf("]") + 1;
      const cleanJson = text.substring(startIndex, endIndex);
      const recipesData = JSON.parse(cleanJson);

      const recipesWithImages = recipesData.map((recipe: any) => {
        // We use the AI-generated English keywords for a much more accurate image
        // We add 'plate,gourmet' to ensure it looks like a finished dish

        return {
          ...recipe,
          image: `https://static.vecteezy.com/system/resources/previews/000/374/263/non_2x/vector-three-characters-of-chefs.jpg`,
          // Alternative: if you want a purely keyword-based search from Unsplash Source:
          // image: `https://source.unsplash.com/800x600/?${finalQuery}`
        };
      });

      setRecipes(recipesWithImages);
    } catch (err: any) {
      console.error("Error:", err.message);
      setView("picker");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">
          Gemini<span>Chef</span>
        </div>
        <div className="badge">Agentic Engine v1.0</div>
      </nav>

      {view === "picker" && (
        <div className="view-container fade-in">
          <div className="text-center">
            <h2 className="title">Despensa Inteligente</h2>
            <p className="subtitle">Selecciona tus ingredientes.</p>
          </div>
          {Object.entries(INGREDIENTS_CATEGORIZED).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category}</h3>
              <div className="ingredient-grid">
                {items.map((item) => (
                  <button
                    key={item}
                    className={`ingredient-card ${selected.includes(item) ? "selected" : ""}`}
                    onClick={() => toggleItem(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="action-bar sticky-footer">
            <button
              className="btn-primary"
              onClick={generateRecipes}
              disabled={selected.length === 0}
            >
              GENERAR MENÚ IA ({selected.length})
            </button>
          </div>
        </div>
      )}

      {view === "results" && (
        <div className="view-container fade-in">
          {isLoading ? (
            <div className="skeleton-loader">
              <div className="spinner-chef"></div>
              <p>El Chef está razonando tu menú...</p>
            </div>
          ) : (
            <>
              <h2 className="title text-center">Propuestas del Chef</h2>
              <div className="recipe-grid">
                {recipes.map((r) => (
                  <div
                    key={r.id}
                    className="recipe-card-modern"
                    onClick={() => {
                      setCurrentRecipe(r);
                      setView("detail");
                    }}
                  >
                    <span className="recipe-meta">
                      {r.time} • {r.calories}
                    </span>
                    <h3>{r.name}</h3>
                    <p>{r.description}</p>
                    <div className="difficulty-tag">{r.difficulty}</div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <button
                  className="btn-secondary"
                  onClick={() => setView("picker")}
                >
                  Modificar ingredientes
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {view === "detail" && currentRecipe && (
        <div className="view-container fade-in">
          <div className="detail-card">
            <div className="detail-actions">
              <button className="btn-back" onClick={() => setView("results")}>
                ← Volver
              </button>
              <button
                className="btn-secondary-mini"
                onClick={() => {
                  setSelected([]);
                  setView("picker");
                }}
              >
                Nueva Creación 🔄
              </button>
            </div>

            {currentRecipe.image && (
              <div className="recipe-hero-container">
                <img
                  key={currentRecipe.id}
                  src={currentRecipe.image}
                  alt={currentRecipe.name}
                  className="recipe-hero-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              </div>
            )}

            <div className="detail-header">
              <h2>{currentRecipe.name}</h2>
              <div className="detail-tags">
                <span>⏱️ {currentRecipe.time}</span>
                <span>🔥 {currentRecipe.calories}</span>
                <span>📊 {currentRecipe.difficulty}</span>
              </div>
            </div>

            <div className="detail-grid">
              <div className="detail-section ingredients-box">
                <p className="formatted-text">
                  {currentRecipe.ingredientsList}
                </p>
              </div>
              <div className="detail-section steps-box">
                <p className="formatted-text">{currentRecipe.instructions}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 *  const model = genAI.getGenerativeModel({

        model: "gemini-3.1-flash-lite-preview", // Esta es la versión 3.1

    });  USE THIS MODEL TO AVOID 503 ERRORS. The stable version seems to be having issues with high demand, while the flash-lite-preview is more responsive.
 */
