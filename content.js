// Data sources: Ministry of Culture 2023/2024 (Approximate figures)
const FUNDING_DATA = {
  // Quotidiens Nationaux
  "Le Monde": "8,3M€",
  "Le Figaro": "10,6M€",
  "Libération": "6,3M€",
  "Aujourd'hui en France": "12,2M€",
  "Le Parisien": "12,2M€",
  "La Croix": "9,2M€",
  "L'Humanité": "6,5M€",
  "L'Opinion": "0,8M€",
  "Les Echos": "0,9M€",
  "Ouest-France": "6,8M€",

  // Magazines
  "L'Obs": "0,2M€",
  "Le Point": "1,1M€",
  "L'Express": "0,1M€",
  "Marianne": "0,9M€",
  "Valeurs Actuelles": "0,4M€",
  "Télérama": "5,5M€",
  "Médiapart": "0€",
  "Politis": "0,3M€",
  "Charlie Hebdo": "0€",

  // TV & Radio (Dotations publiques annuelles pour le service public)
  "France Télévisions": "2,5Md€",
  "France 2": "2,5Md€", // Group amount
  "France 3": "2,5Md€", // Group amount
  "Arte": "300M€",
  "Radio France": "630M€",
  "France Inter": "630M€", // Group amount
  "France Info": "630M€", // Group amount
  "TF1": "0€",
  "M6": "0€",
  "BFMTV": "0€",
  "CNews": "0€"
};

let currentStyle = 'concise';
let initialized = false;

// Function to initialize logic once style is known
function init() {
  if (initialized) return;
  initialized = true;
  processNode(document.body);

  // Observe for mutations
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
}

// Load preference and then init
chrome.storage.sync.get(['displayStyle'], (result) => {
  if (result.displayStyle) {
    currentStyle = result.displayStyle;
  }
  init();
});

// Listen for updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.displayStyle) {
    // If user changes style, we reload to start fresh and avoid complex string diffing
    location.reload();
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getFormattedSuffix(amount) {
  switch (currentStyle) {
    case 'brackets':
      return ` [${amount} public]`;
    case 'visual':
      return ` (💰 ${amount})`;
    case 'minimalist':
      return ` (${amount})`;
    case 'full':
      return ` (${amount} d’argent public en 2024)`;
    case 'concise':
    default:
      return ` (${amount} public '23)`;
  }
}

// Prepare keys: include original and ALL CAPS versions
const baseKeys = Object.keys(FUNDING_DATA);
const allKeys = [];
baseKeys.forEach(key => {
  allKeys.push(key);
  const upper = key.toUpperCase();
  if (upper !== key) {
    allKeys.push(upper);
  }
});

// Sort by length descending for better matching
allKeys.sort((a, b) => b.length - a.length);

const pattern = new RegExp(`\\b(${allKeys.map(escapeRegExp).join('|')})\\b`, 'g');

function processNode(node) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    if (pattern.test(text)) {
      const newText = text.replace(pattern, (match) => {
        // Find amount (standardize match to find in FUNDING_DATA if it was upper case)
        const amount = FUNDING_DATA[match] || FUNDING_DATA[Object.keys(FUNDING_DATA).find(k => k.toUpperCase() === match)];

        if (!amount) return match;

        const suffix = getFormattedSuffix(amount);

        // Prevent double appending
        // Check if any known suffix format is already there (M€ or Md€ followed by public or closing bracket/paren)
        const alreadyHasSuffix = /[\(\[]?(💰 )?\d+(,\d+)?(M€|Md€).+[\)\]]?/.test(text);

        if (alreadyHasSuffix) return match;

        return `${match}${suffix}`;
      });

      if (newText !== text) {
        node.nodeValue = newText;
      }
    }
  } else if (node.nodeType === 1) { // Element node
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'].includes(node.tagName)) {
      return;
    }
    node.childNodes.forEach(processNode);
  }
}

// Initial logic is now handled in the init() function called after storage check

