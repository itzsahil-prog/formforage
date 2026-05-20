import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { v4 as uuidv4 } from "uuid";

// Validate Gemini API Key usage
const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY, 
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
});

// --- MOCK DATABASE ---
// This serves as our simulated backend since we are in a sandbox without real DB connections
const users = [
  { id: '1', name: 'Sahil', email: 'itzsahilg1@gmail.com', password: 'itzsahil@123', role: 'ADMIN' }
];

let forms: any[] = [
  {
    id: "demo-form",
    userId: "1",
    title: "Internship Registration",
    description: "Welcome to our 2026 internship program.",
    createdAt: new Date().toISOString(),
    theme: { color: "blue" },
    questions: [
      { id: "q1", type: "short_text", title: "Full Name", required: true },
      { id: "q2", type: "email", title: "Email Address", required: true },
      { id: "q3", type: "long_text", title: "Why do you want to join us?", required: false }
    ],
    responses: [] // embedded responses for ease of demo
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES ---

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    // Simple mock token
    res.json({ token: `mock-jwt-token-${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.post("/api/auth/signup", (req, res) => {
    const { name, email, password } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: "User already exists" });
    }
    const newUser = { id: uuidv4(), name: name || 'User', email, password, role: 'ADMIN' };
    users.push(newUser);
    res.json({ token: `mock-jwt-token-${newUser.id}`, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
  });

  app.post("/api/auth/google", (req, res) => {
    const { email, name } = req.body;
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { id: uuidv4(), name: name || 'User', email, password: 'google_oauth_no_password', role: 'ADMIN' };
      users.push(user);
    }
    res.json({ token: `mock-jwt-token-${user.id}`, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // Forms CRUD
  app.get("/api/forms", (req, res) => {
    // In real app, filter by userId
    res.json(forms.map(f => ({
      id: f.id,
      title: f.title,
      description: f.description,
      createdAt: f.createdAt,
      responsesCount: f.responses.length
    })));
  });

  app.get("/api/forms/:id", (req, res) => {
    const form = forms.find(f => f.id === req.params.id);
    if (!form) return res.status(404).json({ error: "Form not found" });
    res.json(form);
  });

  app.post("/api/forms", (req, res) => {
    const newForm = {
      id: uuidv4(),
      userId: "1", // Hardcoded to admin user for demo
      createdAt: new Date().toISOString(),
      responses: [],
      ...req.body
    };
    forms.push(newForm);
    res.json(newForm);
  });

  app.put("/api/forms/:id", (req, res) => {
    const idx = forms.findIndex(f => f.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: "Form not found" });
    forms[idx] = { ...forms[idx], ...req.body };
    res.json(forms[idx]);
  });

  app.delete("/api/forms/:id", (req, res) => {
    forms = forms.filter(f => f.id !== req.params.id);
    res.json({ success: true });
  });

  // Submit Response
  app.post("/api/forms/:id/submit", (req, res) => {
    const form = forms.find(f => f.id === req.params.id);
    if (!form) return res.status(404).json({ error: "Form not found" });
    
    const newResponse = {
      id: uuidv4(),
      submittedAt: new Date().toISOString(),
      answers: req.body.answers // Record<questionId, any>
    };
    form.responses.push(newResponse);
    res.json({ success: true, responseId: newResponse.id });
  });

  // AI Generation
  app.post("/api/ai/generate-form", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: "Gemini API Key is not configured." });
    }
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Create a form structure based on this prompt: "${prompt}". 
        Return ONLY valid JSON.
        The questions array should follow this structure: 
        { id: string, type: string (short_text, long_text, email, number, dropdown, multiple_choice, checkbox), title: string, required: boolean, options?: string[] (for dropdown/multiple_choice) }
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Title of the form" },
              description: { type: Type.STRING, description: "Description of the form" },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    required: { type: Type.BOOLEAN },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    }
                  },
                  required: ["id", "type", "title", "required"]
                }
              }
            },
            required: ["title", "description", "questions"]
          }
        }
      });
      
      const generatedData = JSON.parse(response.text || '{}');
      
      // Save it automatically
      const newForm = {
        id: uuidv4(),
        userId: "1",
        createdAt: new Date().toISOString(),
        responses: [],
        title: generatedData.title || "Generated Form",
        description: generatedData.description || "",
        questions: generatedData.questions || [],
        theme: { color: "zinc" }
      };
      forms.push(newForm);

      res.json(newForm);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to generate form", details: err.message });
    }
  });


  // AI Generate Suggestions
  app.post("/api/ai/suggest-questions", async (req, res) => {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(401).json({ error: "Gemini API Key is not configured." });
    }
    const { title, description, existingQuestions } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Based on a form titled "${title}" with description "${description || ''}", and existing questions: ${JSON.stringify((existingQuestions || []).map((q: any) => q.title))}. 
        Suggest 3 relevant new questions that could be added to this form.
        Return ONLY valid JSON.
        The questions array should follow this structure: 
        [ { type: string (short_text, long_text, email, number, dropdown, multiple_choice, checkbox), title: string, options?: string[] (for dropdown/multiple_choice/checkbox) } ]
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                title: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ["type", "title"]
            }
          }
        }
      });
      
      const suggestedQuestions = JSON.parse(response.text || '[]');
      res.json(suggestedQuestions);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: "Failed to suggest questions", details: err.message });
    }
  });

  // --- VITE MIDDLEWARE ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production dist serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
