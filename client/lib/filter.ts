export const matches = (c: any, lang: string, fw: string | null) => {
  if (lang && lang !== 'Aucun') {
    if (c.languages && Array.isArray(c.languages) && c.languages.length) {
      if (!c.languages.includes(lang)) return false;
    }
  }
  if (fw && fw !== 'Aucun') {
    if (c.frameworks && Array.isArray(c.frameworks) && c.frameworks.length) {
      if (!c.frameworks.includes(fw)) return false;
    }
  }
  return true;
};
