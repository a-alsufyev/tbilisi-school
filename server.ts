import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Simple health check at the very beginning
  app.get("/health", (req, res) => {
    res.send("OK");
  });

  // API route to get school description from text file
  app.get("/api/schools/:identifier/description", (req, res) => {
    const { identifier } = req.params;
    const descriptionsDir = path.join(process.cwd(), "data", "descriptions");
    
    console.log(`[API] Fetching description for identifier: ${identifier}`);
    
    // Try to find file by slug or by index
    let descFilePath = path.join(descriptionsDir, `${identifier}.txt`);
    
    console.log(`[API] Checking path: ${descFilePath}`);
    
    // Fallback for older index-based files if needed
    if (!fs.existsSync(descFilePath)) {
      console.log(`[API] File not found at ${descFilePath}, trying fallback...`);
      descFilePath = path.join(descriptionsDir, `school_${identifier}.txt`);
      console.log(`[API] Checking fallback path: ${descFilePath}`);
    }
    
    try {
      if (!fs.existsSync(descFilePath)) {
        console.log(`[API] Description file not found for ${identifier}`);
        return res.status(404).json({ error: "Description file not found", path: descFilePath });
      }
      const description = fs.readFileSync(descFilePath, "utf-8");
      console.log(`[API] Successfully read description for ${identifier} (${description.length} chars)`);
      res.json({ description });
    } catch (error) {
      console.error(`Error reading description for identifier ${identifier}:`, error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // API route to get schools from schools.csv
  app.get("/api/schools", (req, res) => {
    const filePath = path.join(process.cwd(), "data", "schools.csv");
    const descriptionsDir = path.join(process.cwd(), "data", "descriptions");
    
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Schools file not found" });
      }
      
      // Ensure descriptions directory exists
      if (!fs.existsSync(descriptionsDir)) {
        fs.mkdirSync(descriptionsDir, { recursive: true });
      }

      const data = fs.readFileSync(filePath, "utf-8");
      const lines = data.split("\n").filter((line) => line.trim() !== "");
      
      // Skip header
      const schools = lines.slice(1).map((line, index) => {
        // Simple CSV parser for quoted strings
        const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
        if (!matches) return null;
        
        const [name, address, coordinates, languages, cost, program, comment] = matches.map(s => s.replace(/^"|"$/g, '').trim());
        
        // Improved slugifier to handle non-latin characters
        let slug = name.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF]/g, '_').substring(0, 50);
        if (!slug || slug.replace(/_/g, '').length === 0) {
          slug = `school_${index}`;
        }
        
        // Create description file if it doesn't exist
        const descFilePath = path.join(descriptionsDir, `${slug}.txt`);
        if (!fs.existsSync(descFilePath)) {
          fs.writeFileSync(descFilePath, comment || `Description for ${name}`);
        }

        return { 
          id: index, 
          slug, // Add slug to the school object
          name, 
          address, 
          coordinates,
          languages,
          cost,
          program,
          comment
        };
      }).filter(s => s !== null);
      
      res.json(schools);
    } catch (error) {
      console.error("Error reading schools file:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Function to initialize descriptions on startup
  const initializeDescriptions = () => {
    const dataDir = path.resolve(process.cwd(), "data");
    const filePath = path.join(dataDir, "schools.csv");
    const descriptionsDir = path.join(dataDir, "descriptions");
    
    try {
      if (fs.existsSync(filePath)) {
        if (!fs.existsSync(descriptionsDir)) {
          fs.mkdirSync(descriptionsDir, { recursive: true });
        }
        const data = fs.readFileSync(filePath, "utf-8");
        const lines = data.split("\n").filter((line) => line.trim() !== "");
        lines.slice(1).forEach((line, index) => {
          const matches = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g);
          if (matches) {
            const [name, , , , , , comment] = matches.map(s => s.replace(/^"|"$/g, '').trim());
            // Improved slugifier to handle non-latin characters
            let slug = name.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF]/g, '_').substring(0, 50);
            if (!slug || slug.replace(/_/g, '').length === 0) {
              slug = `school_${index}`;
            }
            const descFilePath = path.join(descriptionsDir, `${slug}.txt`);
            if (!fs.existsSync(descFilePath)) {
              fs.writeFileSync(descFilePath, comment || `Description for ${name}`);
            }
          }
        });
        console.log("[Server] Descriptions initialized successfully");
      }
    } catch (err) {
      console.error("[Server] Failed to initialize descriptions:", err);
    }
  };

  initializeDescriptions();

  // API route to get Yandex Maps API Key safely
  app.get("/api/config", (req, res) => {
    res.json({
      yandexMapsApiKey: process.env.YANDEX_MAPS_API_KEY || "",
    });
  });

  // Catch-all for /api routes to ensure they always return JSON
  app.all("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Creating Vite server...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("[Server] Vite server created successfully");
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Started successfully`);
    console.log(`[Server] Listening on http://0.0.0.0:${PORT}`);
    console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

console.log("[Server] Initializing startServer...");
startServer().catch((err) => {
  console.error("[Server] Critical error during startup:", err);
});
