// Data sources: Ministry of Culture 2024 (Approximate figures)
const FUNDING_DATA = {
  "Le Monde": "7,8 millions €",
  "Le Figaro": "9,9 millions €",
  "Libération": "6,6 millions €",
  "Aujourd'hui en France": "12,2 millions €",
  "La Croix": "Est. 3-4 millions €", // Estimate based on typical pluralism aid
  "L'Humanité": "Est. 3-4 millions €", // Estimate based on typical pluralism aid
  "L'Opinion": "Est. <1 million €",
  "Les Echos": "Est. <1 million €"
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Create a regex that matches any of the newspaper names
// We use \b to ensure we match whole words (though names with spaces need care)
// For multi-word names like "Le Monde", \bLe Monde\b works.
const fundingKeys = Object.keys(FUNDING_DATA);
// Sort by length descending to match longest phrases first (e.g. avoid matching "Le Monde" inside "Le Monde Diplomatique" if we had that, though here it's fine)
fundingKeys.sort((a, b) => b.length - a.length);

const pattern = new RegExp(`\\b(${fundingKeys.map(escapeRegExp).join('|')})\\b`, 'g');

function processNode(node) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    if (pattern.test(text)) {
      // We found a match. We need to replace it.
      // However, simple string replacement in text node might break if we want to add style.
      // For this request: "append to all newspaper name ... like this : Le Monde -> Le Monde (4,3 millions ...)"
      // So plain text modification is enough.
      
      const newText = text.replace(pattern, (match) => {
        const amount = FUNDING_DATA[match];
         // Check if already appended to avoid double appending if script runs twice or on dynamic updates
        const suffix = ` (${amount} d’argent public en 2024)`;
        if (text.includes(suffix)) return match; 
        return `${match}${suffix}`;
      });
      
      if (newText !== text) {
        node.nodeValue = newText;
      }
    }
  } else if (node.nodeType === 1) { // Element node
    // Skip script and style tags, and maybe inputs
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'].includes(node.tagName)) {
      return;
    }
    
    // Recurse
    node.childNodes.forEach(processNode);
  }
}

// Run on initial load
processNode(document.body);

// Optional: Observe for mutations (dynamic content)
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
       processNode(node);
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
