export const LANGS = [
  "Aucun","JavaScript","TypeScript","Python","Java","C#","PHP","C","C++","Go","Rust","Ruby","Kotlin","Swift","Dart","SQL","HTML/CSS","Bash","Shell","R","Perl","Lua","Haskell","Elixir","Erlang","Scala","OCaml","Assembly","Fortran","MATLAB","Groovy","Clojure","Objective-C","Visual Basic"
] as const;

export const FRAMEWORKS = [
  "Aucun",
  "React",
  "Next.js",
  "Gatsby",
  "Remix",
  "Vue",
  "Nuxt",
  "Svelte",
  "SvelteKit",
  "Angular",
  "Ember",
  "Meteor",
  "Express",
  "Fastify",
  "Koa",
  "Hapi",
  "Node.js",
  "Django",
  "Django REST Framework",
  "Flask",
  "FastAPI",
  "Pyramid",
  "Spring Boot",
  "Quarkus",
  "Micronaut",
  "Laravel",
  "Symfony",
  "Rails",
  "Phoenix",
  "ASP.NET",
  "NestJS",
  "AdonisJS",
  "Expo/React Native",
  "React Native",
  "Ionic",
  "Cordova",
  "Flutter",
  "Android",
  "iOS/SwiftUI",
  "Electron",
  "NextAuth",
  "TensorFlow",
  "PyTorch"
] as const;

export const TOP_LANGS = LANGS.slice(0, 20);
export const TOP_FRAMEWORKS = FRAMEWORKS.slice(0, 20);

export const SANDBOX_LANGS = [
  // Frontend
  'javascript',
  'typescript', 
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'jsx',
  'tsx',
  'vue',
  'svelte',
  
  // Backend
  'python',
  'java',
  'c',
  'cpp',
  'csharp',
  'php',
  'ruby',
  'go',
  'rust',
  'kotlin',
  'swift',
  'dart',
  'scala',
  'haskell',
  'elixir',
  'erlang',
  'lua',
  'perl',
  'r',
  'matlab',
  'groovy',
  'clojure',
  
  // Shell/DevOps
  'bash',
  'shell',
  'powershell',
  'dockerfile',
  'yaml',
  'json',
  'xml',
  
  // Database
  'sql',
  'pgsql',
  'mysql',
  'mongodb',
  
  // Config/Meta
  'markdown',
  'toml',
  'ini'
] as const;
