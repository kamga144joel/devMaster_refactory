import React, { useRef, useState, useEffect, Suspense } from "react";
const Editor = React.lazy(() => import('@monaco-editor/react'));
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, RotateCcw, Maximize, Minimize, Code, Monitor, Zap, HelpCircle, Moon, Sun, Eye, RefreshCw, Terminal, ChevronRight, Sparkles, MessageSquare, Send, Bot, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SANDBOX_LANGS } from "@/lib/platforms";

// Composant de chargement personnalisé
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      <p className="text-sm text-muted-foreground">Chargement de l'éditeur...</p>
    </div>
  </div>
);

// Définition des exemples de code par langage
const CODE_EXAMPLES = {
  // Frontend Languages
  javascript: `// Exemple de code JavaScript
function saluer(nom) {
  return 'Bonjour ' + nom + '!';
}

console.log(saluer('Développeur'));

// Essayez de modifier ce code et cliquez sur Exécuter`,
  
  typescript: `// Exemple de code TypeScript
interface Utilisateur {
  nom: string;
  age: number;
}

function creerUtilisateur(nom: string, age: number): Utilisateur {
  return { nom, age };
}

const user = creerUtilisateur('Alice', 30);
console.log(user);`,
  
  html: `<!DOCTYPE html>
<html>
<head>
  <title>Preview HTML</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 20px;
      text-align: center;
    }
    button {
      background: #4CAF50;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      transition: all 0.3s;
    }
    button:hover {
      background: #45a049;
      transform: translateY(-2px);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 Bac à Sable Interactif</h1>
    <button onclick="alert('JavaScript fonctionne !')">Cliquez-moi !</button>
  </div>
</body>
</html>`,
  
  css: `/* Exemple de code CSS */
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 15px;
  color: white;
  text-align: center;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.button {
  background: #4CAF50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.button:hover {
  background: #45a049;
  transform: translateY(-2px);
}`,
  
  scss: `/* Exemple de code SCSS */
$primary-color: #667eea;
$secondary-color: #764ba2;
$border-radius: 15px;

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
  border-radius: $border-radius;
  color: white;
  text-align: center;

  h1 {
    font-size: 2.5em;
    margin-bottom: 20px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .button {
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: #45a049;
      transform: translateY(-2px);
    }
  }
}`,
  
  jsx: `// Exemple de code JSX (React)
import React, { useState } from 'react';

function Compteur() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <h1>Compteur JSX</h1>
      <p>Vous avez cliqué {count} fois</p>
      <button onClick={() => setCount(count + 1)}>
        Cliquez-moi !
      </button>
    </div>
  );
}

export default Compteur;`,
  
  tsx: `// Exemple de code TSX (React avec TypeScript)
import React, { useState } from 'react';

interface CompteurProps {
  initialValue?: number;
}

function Compteur({ initialValue = 0 }: CompteurProps) {
  const [count, setCount] = useState<number>(initialValue);

  return (
    <div className="container">
      <h1>Compteur TSX</h1>
      <p>Vous avez cliqué {count} fois</p>
      <button onClick={() => setCount(count + 1)}>
        Cliquez-moi !
      </button>
    </div>
  );
}

export default Compteur;`,
  
  // Backend Languages
  python: `# Exemple de code Python
def factorielle(n):
    """Calcule la factorielle de n"""
    if n == 0:
        return 1
    else:
        return n * factorielle(n-1)

# Test de la fonction
resultat = factorielle(5)
print(f"La factorielle de 5 est: {resultat}")

# Exemple avec classe
class Calculatrice:
    def __init__(self):
        self.historique = []
    
    def additionner(self, a, b):
        resultat = a + b
        self.historique.append(f"{a} + {b} = {resultat}")
        return resultat

calc = Calculatrice()
print(calc.additionner(10, 5))`,
  
  java: `// Exemple de code Java
public class Calculatrice {
    private List<String> historique;
    
    public Calculatrice() {
        this.historique = new ArrayList<>();
    }
    
    public int additionner(int a, int b) {
        int resultat = a + b;
        historique.add(a + " + " + b + " = " + resultat);
        return resultat;
    }
    
    public void afficherHistorique() {
        System.out.println("Historique des calculs:");
        for (String operation : historique) {
            System.out.println(operation);
        }
    }
    
    public static void main(String[] args) {
        Calculatrice calc = new Calculatrice();
        int resultat = calc.additionner(10, 5);
        System.out.println("Résultat: " + resultat);
        calc.afficherHistorique();
    }
}`,
  
  c: `// Exemple de code C
#include <stdio.h>
#include <stdlib.h>

// Structure pour une calculatrice
typedef struct {
    int historique[100];
    int taille;
} Calculatrice;

// Fonction pour additionner
int additionner(int a, int b) {
    return a + b;
}

// Fonction principale
int main() {
    Calculatrice calc;
    calc.taille = 0;
    
    int resultat = additionner(10, 5);
    calc.historique[calc.taille++] = resultat;
    
    printf("Résultat: %d\\n", resultat);
    printf("Taille de l'historique: %d\\n", calc.taille);
    
    return 0;
}`,
  
  cpp: `// Exemple de code C++
#include <iostream>
#include <vector>
#include <string>

class Calculatrice {
private:
    std::vector<std::string> historique;
    
public:
    int additionner(int a, int b) {
        int resultat = a + b;
        historique.push_back(std::to_string(a) + " + " + std::to_string(b) + " = " + std::to_string(resultat));
        return resultat;
    }
    
    void afficherHistorique() const {
        std::cout << "Historique des calculs:" << std::endl;
        for (const auto& operation : historique) {
            std::cout << operation << std::endl;
        }
    }
};

int main() {
    Calculatrice calc;
    int resultat = calc.additionner(10, 5);
    std::cout << "Résultat: " << resultat << std::endl;
    calc.afficherHistorique();
    return 0;
}`,
  
  csharp: `// Exemple de code C#
using System;
using System.Collections.Generic;

public class Calculatrice
{
    private List<string> historique;
    
    public Calculatrice()
    {
        historique = new List<string>();
    }
    
    public int Additionner(int a, int b)
    {
        int resultat = a + b;
        historique.Add($"{a} + {b} = {resultat}");
        return resultat;
    }
    
    public void AfficherHistorique()
    {
        Console.WriteLine("Historique des calculs:");
        foreach (string operation in historique)
        {
            Console.WriteLine(operation);
        }
    }
}

class Program
{
    static void Main(string[] args)
    {
        Calculatrice calc = new Calculatrice();
        int resultat = calc.Additionner(10, 5);
        Console.WriteLine($"Résultat: {resultat}");
        calc.AfficherHistorique();
    }
}`,
  
  php: `<?php
// Exemple de code PHP
class Calculatrice {
    private $historique = [];
    
    public function additionner($a, $b) {
        $resultat = $a + $b;
        $this->historique[] = "$a + $b = $resultat";
        return $resultat;
    }
    
    public function afficherHistorique() {
        echo "Historique des calculs:\\n";
        foreach ($this->historique as $operation) {
            echo $operation . "\\n";
        }
    }
}

// Utilisation
$calc = new Calculatrice();
$resultat = $calc->additionner(10, 5);
echo "Résultat: $resultat\\n";
$calc->afficherHistorique();
?>`,
  
  ruby: `# Exemple de code Ruby
class Calculatrice
  attr_reader :historique
  
  def initialize
    @historique = []
  end
  
  def additionner(a, b)
    resultat = a + b
    @historique << "#{a} + #{b} = #{resultat}"
    resultat
  end
  
  def afficher_historique
    puts "Historique des calculs:"
    @historique.each { |operation| puts operation }
  end
end

# Utilisation
calc = Calculatrice.new
resultat = calc.additionner(10, 5)
puts "Résultat: #{resultat}"
calc.afficher_historique`,
  
  go: `// Exemple de code Go
package main

import "fmt"

type Calculatrice struct {
    historique []string
}

func (c *Calculatrice) additionner(a, b int) int {
    resultat := a + b
    operation := fmt.Sprintf("%d + %d = %d", a, b, resultat)
    c.historique = append(c.historique, operation)
    return resultat
}

func (c *Calculatrice) afficherHistorique() {
    fmt.Println("Historique des calculs:")
    for _, operation := range c.historique {
        fmt.Println(operation)
    }
}

func main() {
    calc := &Calculatrice{}
    resultat := calc.additionner(10, 5)
    fmt.Printf("Résultat: %d\\n", resultat)
    calc.afficherHistorique()
}`,
  
  rust: `// Exemple de code Rust
struct Calculatrice {
    historique: Vec<String>,
}

impl Calculatrice {
    fn new() -> Self {
        Calculatrice {
            historique: Vec::new(),
        }
    }
    
    fn additionner(&mut self, a: i32, b: i32) -> i32 {
        let resultat = a + b;
        let operation = format!("{} + {} = {}", a, b, resultat);
        self.historique.push(operation);
        resultat
    }
    
    fn afficher_historique(&self) {
        println!("Historique des calculs:");
        for operation in &self.historique {
            println!("{}", operation);
        }
    }
}

fn main() {
    let mut calc = Calculatrice::new();
    let resultat = calc.additionner(10, 5);
    println!("Résultat: {}", resultat);
    calc.afficher_historique();
}`,
  
  // Shell/DevOps
  bash: `#!/bin/bash
# Exemple de script Bash

echo "🚀 Script de démonstration"
echo "=========================="

# Variables
NOM="Développeur"
AGE=25

# Fonctions
saluer() {
    echo "Bonjour $1 ! Tu as $2 ans."
}

# Boucles
for i in {1..5}; do
    echo "Itération $i"
done

# Condition
if [ $AGE -gt 18 ]; then
    echo "Tu es majeur"
else
    echo "Tu es mineur"
fi

# Appel de fonction
saluer $NOM $AGE

echo "Script terminé avec succès !"`,
  
  powershell: `# Exemple de script PowerShell
Write-Host "🚀 Script de démonstration" -ForegroundColor Green
Write-Host "=========================="

# Variables
$nom = "Développeur"
$age = 25

# Fonctions
function Saluer($personne, $age) {
    Write-Host "Bonjour $personne ! Tu as $age ans." -ForegroundColor Cyan
}

# Boucles
for ($i = 1; $i -le 5; $i++) {
    Write-Host "Itération $i" -ForegroundColor Yellow
}

# Condition
if ($age -gt 18) {
    Write-Host "Tu es majeur" -ForegroundColor Green
} else {
    Write-Host "Tu es mineur" -ForegroundColor Red
}

# Appel de fonction
Saluer $nom $age

Write-Host "Script terminé avec succès !" -ForegroundColor Green`,
  
  // Database
  sql: `-- Exemple de code SQL
-- Création de tables
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    age INT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(200) NOT NULL,
    description TEXT,
    utilisateur_id INT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id)
);

-- Insertion de données
INSERT INTO utilisateurs (nom, email, age) VALUES
('Alice', 'alice@example.com', 30),
('Bob', 'bob@example.com', 25),
('Charlie', 'charlie@example.com', 35);

INSERT INTO projets (titre, description, utilisateur_id) VALUES
('Site Web', 'Développement d\\'un site e-commerce', 1),
('Application Mobile', 'App iOS pour gestion de tâches', 2),
('API REST', 'API pour service cloud', 3);

-- Requêtes SELECT
SELECT u.nom, u.email, p.titre 
FROM utilisateurs u 
JOIN projets p ON u.id = p.utilisateur_id
WHERE u.age > 25;

-- Agrégation
SELECT COUNT(*) as total_projets, 
       AVG(age) as age_moyen 
FROM utilisateurs u 
JOIN projets p ON u.id = p.utilisateur_id;`,
  
  // Config/Meta
  json: `{
  "projet": "Bac à Sable",
  "version": "1.0.0",
  "langages": ["JavaScript", "Python", "Java", "C++"],
  "config": {
    "theme": "dark",
    "autoExecution": true,
    "fontSize": 14
  },
  "utilisateur": {
    "nom": "Développeur",
    "niveau": "intermédiaire",
    "preferences": {
      "langagePrincipal": "JavaScript",
      "frameworks": ["React", "Node.js"]
    }
  },
  "statistiques": {
    "exercicesCompletes": 42,
    "tempsTotal": 3600,
    "scoreMoyen": 85.5
  }
}`,
  
  yaml: `# Exemple de configuration YAML
projet: "Bac à Sable"
version: "1.0.0"
langages:
  - JavaScript
  - Python
  - Java
  - C++

config:
  theme: "dark"
  autoExecution: true
  fontSize: 14

utilisateur:
  nom: "Développeur"
  niveau: "intermédiaire"
  preferences:
    langagePrincipal: "JavaScript"
    frameworks:
      - React
      - Node.js

statistiques:
  exercicesCompletes: 42
  tempsTotal: 3600
  scoreMoyen: 85.5

serveur:
  host: "localhost"
  port: 8080
  ssl: false
  
base_de_donnees:
  type: "postgresql"
  host: "localhost"
  port: 5432
  nom: "sandbox_db"`,
  
  markdown: `# Bac à Sable de Code

## 🚀 Fonctionnalités

Le bac à sable vous permet de coder dans **plusieurs langages** avec une interface moderne et professionnelle.

### Langages Supportés

#### Frontend
- **JavaScript** - Programmation web interactive
- **TypeScript** - JavaScript typé
- **HTML/CSS** - Développement web
- **React** - Framework JavaScript

#### Backend
- **Python** - Scripting et backend
- **Java** - Applications enterprise
- **C++** - Performance et systèmes
- **Go** - Backend moderne
- **Rust** - Performance et sécurité

### 🎯 Exemples

\`\`\`javascript
function saluer(nom) {
  return \`Bonjour \${nom} !\`;
}

console.log(saluer("Développeur"));
\`\`\`

### 💡 Conseils

1. **Expérimentez** avec différents langages
2. **Utilisez l'auto-complétion** pour coder plus vite
3. **Testez votre code** avec le bouton Exécuter
4. **Demandez à l'IA** pour de l'aide

---

> *Commencez par choisir un langage dans le menu déroulant !*`
};

export default function Sandbox() {
  const [language, setLanguage] = useState<string>('javascript');
  const [code, setCode] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'preview'>('editor');
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [autoPreview, setAutoPreview] = useState<boolean>(true);
  const previewRef = useRef<HTMLIFrameElement>(null);
  
  // Terminal states
  const [terminalVisible, setTerminalVisible] = useState<boolean>(false);
  const [terminalHistory, setTerminalHistory] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState<string>('');
  const [terminalSuggestions, setTerminalSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInputRef = useRef<HTMLInputElement>(null);
  
  // Chat IA states
  const [chatVisible, setChatVisible] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: 'user' | 'assistant', content: string, timestamp: number}>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const chatRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-complétion states
  const [editorRef, setEditorRef] = useState<any>(null);
  const [autoCompletionEnabled, setAutoCompletionEnabled] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [autoRun, setAutoRun] = useState<boolean>(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);
  const [executionTime, setExecutionTime] = useState<number>(0);
  const { toast } = useToast();
  const outputRef = useRef<HTMLDivElement>(null);

  // Charger le code d'exemple lors du changement de langage
  useEffect(() => {
    const example = CODE_EXAMPLES[language as keyof typeof CODE_EXAMPLES] || 
                   '// Sélectionnez un langage pour voir un exemple';
    setCode(example);
    setOutput('');
    if (language === 'html') {
      setPreviewHtml(example);
      setActiveTab('preview');
    } else {
      setPreviewHtml('');
    }
  }, [language]);

  // Auto-preview pour HTML
  useEffect(() => {
    if (language === 'html' && autoPreview) {
      const timeoutId = setTimeout(() => {
        setPreviewHtml(code);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [code, language, autoPreview]);

  // Effet pour l'auto-exécution
  useEffect(() => {
    if (autoRun && code) {
      const timeoutId = setTimeout(executeCode, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [code, autoRun]);

  // Faire défiler la sortie vers le bas quand elle est mise à jour
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Gérer le mode plein écran
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
        setIsFullscreen(false);
      }
    }
  };

  // Exécuter le code
  const executeCode = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setActiveTab('output');
    setOutput('Exécution en cours...\n');
    
    // Simuler un délai d'exécution
    const startTime = performance.now();
    
    try {
      // Sauvegarder la console.log originale
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      // Capturer les sorties de console
      let outputText = '';
      console.log = (...args) => {
        outputText += args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') + '\n';
      };
      
      console.error = (...args) => {
        outputText += 'Erreur: ' + args.map(String).join(' ') + '\n';
      };
      
      // Exécuter le code en fonction du langage
      switch (language) {
        case 'javascript':
        case 'typescript':
          // Utiliser Function pour exécuter le code JS/TS de manière sûre
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          try {
            const fn = new AsyncFunction(code);
            const result = await fn();
            if (result !== undefined) {
              outputText += 'Résultat: ' + 
                (typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result)) + '\n';
            }
          } catch (err) {
            outputText += 'Erreur: ' + (err as Error).message + '\n';
          }
          break;
          
        case 'python':
          // Simulation d'exécution Python (dans un vrai environnement, vous utiliseriez Pyodide)
          outputText += 'Exécution Python simulée. Dans un environnement réel, ce code s\'exécuterait avec Pyodide.\n';
          outputText += 'Code Python à exécuter :\n' + code + '\n';
          break;
          
        case 'html':
          // Pour HTML, afficher un aperçu
          outputText += 'Aperçu HTML (simulé) :\n';
          outputText += 'Le code HTML serait rendu dans un iframe dans un environnement de production.\n';
          break;
          
        default:
          outputText += `Langage non supporté : ${language}\n`;
      }
      
      // Restaurer la console.log originale
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      // Mettre à jour la sortie
      setOutput(outputText || 'Aucune sortie.');
      
    } catch (err) {
      setOutput('Erreur lors de l\'exécution : ' + (err as Error).message);
    } finally {
      const endTime = performance.now();
      setExecutionTime(parseInt((endTime - startTime).toFixed(2)));
      setLastRunTime(Date.now());
      setIsRunning(false);
    }
  };

  // Réinitialiser l'éditeur
  const resetEditor = () => {
    const example = CODE_EXAMPLES[language as keyof typeof CODE_EXAMPLES] || 
                   '// Sélectionnez un langage pour voir un exemple';
    setCode(example);
    setOutput('');
  };

  // Copier le code dans le presse-papier
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copié",
        description: "Le code a été copié dans le presse-papiers.",
      });
    } catch (err) {
      toast({
        title: "Erreur",
        description: "Impossible de copier le code.",
        variant: "destructive",
      });
    }
  };

  // Rafraîchir le preview
  const refreshPreview = () => {
    if (language === 'html') {
      setPreviewHtml(code);
      toast({
        title: "Preview actualisé",
        description: "Le preview a été rafraîchi.",
      });
    }
  };

  // Ouvrir le preview dans un nouvel onglet
  const openPreviewInNewTab = () => {
    if (language === 'html' && previewHtml) {
      const newWindow = window.open();
      if (newWindow) {
        newWindow.document.write(previewHtml);
        newWindow.document.close();
      }
    }
  };

  // Fonctions du terminal
  const executeTerminalCommand = async (command: string) => {
    const output = `$ ${command}`;
    setTerminalHistory(prev => [...prev, output]);
    
    try {
      // Simuler l'exécution de commandes basiques
      if (command.trim() === 'clear') {
        setTerminalHistory([]);
        return;
      }
      
      if (command.trim() === 'help') {
        const helpText = `Commandes disponibles:
  help     - Afficher cette aide
  clear    - Effacer le terminal
  ls       - Lister les fichiers
  pwd      - Afficher le répertoire courant
  npm run  - Exécuter des scripts npm
  node     - Exécuter du code Node.js
  python   - Exécuter du code Python
  echo     - Afficher du texte`;
        setTerminalHistory(prev => [...prev, helpText]);
        return;
      }
      
      if (command.startsWith('echo ')) {
        const text = command.slice(5);
        setTerminalHistory(prev => [...prev, text]);
        return;
      }
      
      if (command.trim() === 'ls') {
        const files = ['index.html', 'style.css', 'script.js', 'package.json', 'README.md'];
        setTerminalHistory(prev => [...prev, files.join('  ')]);
        return;
      }
      
      if (command.trim() === 'pwd') {
        setTerminalHistory(prev => [...prev, '/home/user/sandbox']);
        return;
      }
      
      // Exécuter du code JavaScript/Node.js
      if (command.startsWith('node ')) {
        const code = command.slice(5);
        try {
          const result = eval(code);
          setTerminalHistory(prev => [...prev, String(result)]);
        } catch (error) {
          setTerminalHistory(prev => [...prev, `Error: ${error}`]);
        }
        return;
      }
      
      // Simuler d'autres commandes
      setTerminalHistory(prev => [...prev, `Commande inconnue: ${command}`]);
    } catch (error) {
      setTerminalHistory(prev => [...prev, `Error: ${error}`]);
    }
  };

  // Génération de suggestions IA
  const generateSuggestions = async (input: string) => {
    if (!input.trim()) {
      setTerminalSuggestions([]);
      return;
    }

    const commands = [
      'help', 'clear', 'ls', 'pwd', 'npm run', 'node', 'python', 'echo',
      'npm install', 'npm start', 'npm test', 'npm build',
      'git status', 'git add .', 'git commit', 'git push',
      'python -m', 'python --version',
      'node --version', 'npm --version'
    ];

    const filtered = commands.filter(cmd => 
      cmd.toLowerCase().includes(input.toLowerCase())
    );

    setTerminalSuggestions(filtered.slice(0, 5));
    setShowSuggestions(filtered.length > 0);
    setSelectedSuggestionIndex(-1);
  };

  // Gestion du terminal
  const handleTerminalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (terminalInput.trim()) {
        executeTerminalCommand(terminalInput);
        setTerminalInput('');
        setShowSuggestions(false);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestionIndex > 0) {
        setSelectedSuggestionIndex(selectedSuggestionIndex - 1);
        setTerminalInput(terminalSuggestions[selectedSuggestionIndex - 1]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && selectedSuggestionIndex < terminalSuggestions.length - 1) {
        setSelectedSuggestionIndex(selectedSuggestionIndex + 1);
        setTerminalInput(terminalSuggestions[selectedSuggestionIndex + 1]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const handleTerminalInputChange = (value: string) => {
    setTerminalInput(value);
    generateSuggestions(value);
  };

  const selectSuggestion = (suggestion: string) => {
    setTerminalInput(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    terminalInputRef.current?.focus();
  };

  // Fonctions du Chat IA
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    try {
      // Appel à l'API chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Tu es un assistant de développement expert. Tu aides les développeurs à écrire du code, corriger des erreurs, et exécuter des tâches dans un bac à sable.

Langage actuel: ${language}
Code actuel:

${code}

Tu peux:
- Écrire du code dans le langage approprié
- Corriger les erreurs dans le code existant
- Expliquer des concepts de programmation
- Suggérer des améliorations
- Exécuter des commandes dans le terminal

Sois concis et pratique dans tes réponses.`
            },
            ...chatMessages.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: chatInput }
          ]
        })
      });

      const data = await response.json();
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: data.reply || "Désolé, je n'ai pas pu répondre.",
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

      // Vérifier si l'IA demande d'exécuter du code
      if (data.reply && data.reply.includes('```')) {
        const codeMatch = data.reply.match(/```(\w+)?\n([\s\S]*?)```/);
        if (codeMatch) {
          const suggestedCode = codeMatch[2];
          const suggestedLanguage = codeMatch[1] || language;
          
          // Demander à l'utilisateur s'il veut appliquer le code
          setTimeout(() => {
            if (confirm("L'IA a suggéré du code. Voulez-vous l'appliquer dans l'éditeur ?")) {
              setLanguage(suggestedLanguage);
              setCode(suggestedCode);
              toast({
                title: "Code appliqué",
                description: "Le code suggéré par l'IA a été appliqué.",
              });
            }
          }, 1000);
        }
      }

    } catch (error) {
      console.error('Erreur chat:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: 'Désolé, une erreur est survenue. Veuillez réessayer.',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const clearChat = () => {
    setChatMessages([]);
  };

  // Auto-scroll vers le bas du chat
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Configuration de l'auto-complétion pour l'éditeur
  const setupAutoCompletion = (editor: any, monacoInstance: any) => {
    if (!editor || !autoCompletionEnabled || !monacoInstance) return;

    // Provider d'auto-complétion personnalisé
    const completionProvider = {
      provideCompletionItems: (model: any, position: any) => {
        const word = model.getWordUntilPosition(position);
        const text = model.getValueInRange({
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        });

        const suggestions = getSuggestions(text, language);
        return { suggestions };
      }
    };

    // Enregistrer le provider
    const disposable = monacoInstance.languages.registerCompletionItemProvider(language, completionProvider);
    
    // Nettoyage lors du démontage
    return () => disposable.dispose();
  };

  // Fonction pour générer des suggestions basées sur le contexte
  const getSuggestions = (text: string, lang: string) => {
    const suggestions: any[] = [];
    
    // Suggestions JavaScript/TypeScript
    if (lang === 'javascript' || lang === 'typescript') {
      const jsSuggestions = [
        { label: 'function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'function ${1:name}(${2:params}) {\n  ${3:// body}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'const', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'const ${1:name} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'let', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'let ${1:name} = ${2:value};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if (${1:condition}) {\n  ${2:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n  ${3:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'forEach', kind: monaco.languages.CompletionItemKind.Method, insertText: '.forEach((${1:item}) => {\n  ${2:// code}\n});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'map', kind: monaco.languages.CompletionItemKind.Method, insertText: '.map((${1:item}) => ${2:return});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'filter', kind: monaco.languages.CompletionItemKind.Method, insertText: '.filter((${1:item}) => ${2:return});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'console.log', kind: monaco.languages.CompletionItemKind.Function, insertText: 'console.log(${1:value});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'try-catch', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try {\n  ${1:// code}\n} catch (error) {\n  ${2:// handle error}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'class', kind: monaco.languages.CompletionItemKind.Class, insertText: 'class ${1:ClassName} {\n  constructor(${2:params}) {\n    ${3:// initialization}\n  }\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'async function', kind: monaco.languages.CompletionItemKind.Function, insertText: 'async function ${1:name}(${2:params}) {\n  ${3:// body}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'await', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'await ${1:promise};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'Promise', kind: monaco.languages.CompletionItemKind.Class, insertText: 'new Promise((${1:resolve}, ${2:reject}) => {\n  ${3:// async code}\n});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:name} from \'${2:module}\';', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'export', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'export default ${1:name};', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'addEventListener', kind: monaco.languages.CompletionItemKind.Method, insertText: '.addEventListener(\'${1:event}\', (${2:handler}) => {\n  ${3:// handler code}\n});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'querySelector', kind: monaco.languages.CompletionItemKind.Method, insertText: 'document.querySelector(\'${1:selector}\');', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'useState', kind: monaco.languages.CompletionItemKind.Function, insertText: 'const [${1:state}, set${1:State}] = useState(${2:initialValue});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'useEffect', kind: monaco.languages.CompletionItemKind.Function, insertText: 'useEffect(() => {\n  ${1:// effect code}\n}, [${2:dependencies}]);', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
      ];
      suggestions.push(...jsSuggestions);
    }
    
    // Suggestions Python
    if (lang === 'python') {
      const pythonSuggestions = [
        { label: 'def', kind: monaco.languages.CompletionItemKind.Function, insertText: 'def ${1:function_name}(${2:params}):\n  ${3:# docstring\n  ${4:// code}\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'class', kind: monaco.languages.CompletionItemKind.Class, insertText: 'class ${1:ClassName}:\n  def __init__(self, ${2:params}):\n    ${3:# initialization\n  ${4:// methods\n}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'if', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'if ${1:condition}:\n  ${2:# code}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'for', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'for ${1:item} in ${2:iterable}:\n  ${3:# code}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'while', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'while ${1:condition}:\n  ${2:# code}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'try-except', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'try:\n  ${1:# code\nexcept Exception as e:\n  ${2:# handle error}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'from', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'from ${1:module} import ${2:name}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print(${1:value})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'list', kind: monaco.languages.CompletionItemKind.Class, insertText: '[${1:items}]', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'dict', kind: monaco.languages.CompletionItemKind.Class, insertText: '{${1:key}: ${2:value}}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'lambda', kind: monaco.languages.CompletionItemKind.Function, insertText: 'lambda ${1:params}: ${2:expression}', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
      ];
      suggestions.push(...pythonSuggestions);
    }
    
    // Suggestions HTML
    if (lang === 'html') {
      const htmlSuggestions = [
        { label: 'div', kind: monaco.languages.CompletionItemKind.Class, insertText: '<div>${1:content}</div>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'section', kind: monaco.languages.CompletionItemKind.Class, insertText: '<section>${1:content}</section>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'article', kind: monaco.languages.CompletionItemKind.Class, insertText: '<article>${1:content}</article>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'header', kind: monaco.languages.CompletionItemKind.Class, insertText: '<header>${1:content}</header>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'footer', kind: monaco.languages.CompletionItemKind.Class, insertText: '<footer>${1:content}</footer>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'nav', kind: monaco.languages.CompletionItemKind.Class, insertText: '<nav>${1:content}</nav>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'main', kind: monaco.languages.CompletionItemKind.Class, insertText: '<main>${1:content}</main>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'button', kind: monaco.languages.CompletionItemKind.Class, insertText: '<button type="button" onclick="${1:handler}">${2:text}</button>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'input', kind: monaco.languages.CompletionItemKind.Class, insertText: '<input type="${1:text}" placeholder="${2:placeholder}" />', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'img', kind: monaco.languages.CompletionItemKind.Class, insertText: '<img src="${1:source}" alt="${2:alt}" />', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'link', kind: monaco.languages.CompletionItemKind.Class, insertText: '<a href="${1:url}">${2:text}</a>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'script', kind: monaco.languages.CompletionItemKind.Class, insertText: '<script>\n  ${1:// JavaScript code\n}</script>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'style', kind: monaco.languages.CompletionItemKind.Class, insertText: '<style>\n  ${1:// CSS code\n}</style>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'meta', kind: monaco.languages.CompletionItemKind.Class, insertText: '<meta charset="UTF-8" />', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
        { label: 'title', kind: monaco.languages.CompletionItemKind.Class, insertText: '<title>${1:title}</title>', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
      ];
      suggestions.push(...htmlSuggestions);
    }
    
    // Filtrer les suggestions basées sur le texte entré
    return suggestions.filter(s => 
      s.label.toLowerCase().includes(text.toLowerCase())
    );
  };

  
  return (
    <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : ''}`}>
      {/* En-tête avec contrôles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6 text-primary" />
            Bac à sable de code
          </h2>
          
          <Select 
            value={language}
            onValueChange={setLanguage}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Langage" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CODE_EXAMPLES).map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            <Switch 
              id="auto-run" 
              checked={autoRun}
              onCheckedChange={setAutoRun}
            />
            <Label htmlFor="auto-run" className="text-sm">
              Auto-exécution
            </Label>
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={terminalVisible ? "default" : "outline"}
                size="sm" 
                onClick={() => setTerminalVisible(!terminalVisible)}
                className="gap-1"
              >
                <Terminal className="h-4 w-4" />
                <span className="hidden sm:inline">Terminal</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{terminalVisible ? 'Masquer' : 'Afficher'} le terminal</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={autoCompletionEnabled ? "default" : "outline"}
                size="sm" 
                onClick={() => setAutoCompletionEnabled(!autoCompletionEnabled)}
                className="gap-1"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Auto</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{autoCompletionEnabled ? 'Désactiver' : 'Activer'} l'auto-complétion</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={chatVisible ? "default" : "outline"}
                size="sm" 
                onClick={() => setChatVisible(!chatVisible)}
                className="gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">IA</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{chatVisible ? 'Masquer' : 'Afficher'} l'assistant IA</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleFullscreen}
                className="gap-1"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {isFullscreen ? 'Réduire' : 'Plein écran'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? 'Quitter le mode plein écran' : 'Passer en mode plein écran'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="gap-1"
              >
                {theme === 'dark' ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {theme === 'dark' ? 'Clair' : 'Sombre'}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Basculer en mode {theme === 'dark' ? 'clair' : 'sombre'}</p>
            </TooltipContent>
          </Tooltip>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetEditor}
            className="gap-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Réinitialiser</span>
          </Button>
          
          <Button 
            onClick={executeCode} 
            disabled={isRunning}
            className="gap-1"
          >
            <Play className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isRunning ? 'Exécution...' : 'Exécuter'}
            </span>
          </Button>
        </div>
      </div>
      
      <Separator className="my-2" />
      
      <div className={`flex flex-col overflow-hidden ${terminalVisible || chatVisible ? 'h-[60vh]' : 'flex-1'}`}>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'editor' | 'output' | 'preview')}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-3 max-w-xs mb-2">
            <TabsTrigger value="editor" className="gap-1">
              <Code className="h-4 w-4" /> Éditeur
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1" disabled={language !== 'html'}>
              <Eye className="h-4 w-4" /> Preview
            </TabsTrigger>
            <TabsTrigger value="output" className="gap-1">
              <Monitor className="h-4 w-4" /> Sortie
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="editor" className="mt-0 flex-1 overflow-hidden">
            <div className="h-full border rounded-lg overflow-hidden">
              <Suspense fallback={<LoadingFallback />}>
                <Editor
                  height="100%"
                  defaultLanguage={language}
                  language={language}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={(editor, monacoInstance) => {
                    setEditorRef(editor);
                    if (monacoInstance && autoCompletionEnabled) {
                      setupAutoCompletion(editor, monacoInstance);
                    }
                  }}
                  options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
                    wordWrap: 'on',
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 },
                    lineNumbers: 'on',
                    renderLineHighlight: 'all',
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: autoCompletionEnabled ? { other: true, comments: true, strings: true } : false,
                    parameterHints: { enabled: autoCompletionEnabled },
                    acceptSuggestionOnCommitCharacter: true,
                    acceptSuggestionOnEnter: 'on',
                    scrollbar: {
                      vertical: 'auto',
                      horizontal: 'auto',
                      useShadows: true,
                    },
                  }}
                />
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="mt-0 flex-1 overflow-hidden">
            <div className="h-full flex flex-col border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="h-4 w-4 text-primary" />
                    <span className="font-medium">Preview HTML</span>
                  </div>
                  {language === 'html' && (
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="auto-preview"
                        checked={autoPreview}
                        onCheckedChange={setAutoPreview}
                      />
                      <Label htmlFor="auto-preview" className="text-xs">Auto</Label>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={refreshPreview}
                        className="h-8 w-8"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Rafraîchir le preview</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={openPreviewInNewTab}
                        className="h-8 w-8"
                      >
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ouvrir dans un nouvel onglet</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <div className="flex-1 bg-white">
                {language === 'html' && previewHtml ? (
                  <iframe
                    ref={previewRef}
                    srcDoc={previewHtml}
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                    title="Preview HTML"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Le preview n'est disponible que pour le code HTML</p>
                      <p className="text-sm mt-2">Sélectionnez le langage HTML pour voir le preview</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="output" className="mt-0 flex-1 overflow-hidden">
            <div className="h-full flex flex-col border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-2 border-b bg-muted/20">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {lastRunTime && (
                    <>
                      <Zap className="h-4 w-4 text-amber-500" />
                      <span>Dernière exécution: {new Date(lastRunTime).toLocaleTimeString()}</span>
                      <span className="text-xs">({executionTime}ms)</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyToClipboard}
                    className="h-8 text-xs"
                  >
                    Copier la sortie
                  </Button>
                </div>
              </div>
              <div 
                ref={outputRef}
                className="flex-1 p-4 font-mono text-sm overflow-auto bg-background"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {output || 'Exécutez votre code pour voir la sortie ici.'}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Terminal */}
      {terminalVisible && (
        <div className="border-t border-border">
          <div className="bg-black text-green-400 font-mono text-sm p-2 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span className="text-xs">Terminal</span>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTerminalHistory([])}
              className="h-6 px-2 text-xs text-green-400 hover:bg-green-400/20"
            >
              Clear
            </Button>
          </div>
          <div 
            ref={terminalRef}
            className="bg-black text-green-400 font-mono text-sm p-4 h-40 overflow-y-auto"
            onClick={() => terminalInputRef.current?.focus()}
          >
            {terminalHistory.map((line, index) => (
              <div key={index} className="mb-1">
                {line}
              </div>
            ))}
            
            <div className="flex items-center gap-2 mt-2">
              <ChevronRight className="h-4 w-4 text-green-400" />
              <span className="text-green-400">$</span>
              <div className="flex-1 relative">
                <input
                  ref={terminalInputRef}
                  type="text"
                  value={terminalInput}
                  onChange={(e) => handleTerminalInputChange(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  className="flex-1 bg-transparent outline-none text-green-400 placeholder-green-400/50"
                  placeholder="Tapez une commande..."
                  autoFocus
                />
                
                {/* Suggestions */}
                {showSuggestions && terminalSuggestions.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 bg-gray-900 border border-green-400/30 rounded-t mb-1">
                    {terminalSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className={`px-3 py-1 cursor-pointer flex items-center gap-2 ${
                          index === selectedSuggestionIndex
                            ? 'bg-green-400/20 text-green-300'
                            : 'text-green-400 hover:bg-green-400/10'
                        }`}
                        onClick={() => selectSuggestion(suggestion)}
                      >
                        <Sparkles className="h-3 w-3" />
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Chat IA */}
      {chatVisible && (
        <div className="border-t border-border">
          <div className="bg-muted/50 p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Assistant IA</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-muted-foreground">En ligne</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="h-6 px-2 text-xs"
              >
                Effacer
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setChatVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
          
          <div className="h-80 flex flex-col">
            {/* Messages */}
            <div 
              ref={chatRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {chatMessages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Demandez-moi d'écrire du code, corriger des erreurs ou expliquer des concepts !</p>
                  <div className="mt-4 text-xs space-y-1">
                    <p>Exemples :</p>
                    <p>• "Écris une fonction qui calcule la factorielle"</p>
                    <p>• "Corrige l'erreur dans mon code"</p>
                    <p>• "Explique comment utiliser les promesses en JavaScript"</p>
                  </div>
                </div>
              ) : (
                chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                      <div className="text-xs opacity-70 mt-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
              
              {chatLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <span className="text-sm text-muted-foreground">L'IA réfléchit...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Demandez à l'IA d'écrire du code, corriger des erreurs..."
                  className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                  rows={3}
                  disabled={chatLoading}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim() || chatLoading}
                    size="sm"
                    className="h-10 px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Appuyez sur Entrée pour envoyer, Shift+Entrée pour sauter une ligne
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
        <div>
          {language === 'javascript' && 'Appuyez sur Ctrl+Entrée pour exécuter'}
          {language === 'python' && 'Le support Python est expérimental'}
          {language === 'html' && 'Preview en temps réel disponible'}
          {terminalVisible && ' • Terminal intégré avec suggestions IA'}
          {chatVisible && ' • Assistant IA pour le codage'}
          {autoCompletionEnabled && ' • Auto-complétion intelligente'}
        </div>
        <div className="text-right">
          {code.length} caractères • {code.split('\n').length} lignes
        </div>
      </div>
    </div>
  );
}
