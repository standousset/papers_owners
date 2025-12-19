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
  "France Télévisions": "2500Md€",
  "France 2": "2500Md€", // Group amount
  "France 3": "2500Md€", // Group amount
  "Arte": "300M€",
  "Radio France": "630M€",
  "France Inter": "630M€", // Group amount
  "France Info": "630M€", // Group amount
  "TF1": "0€",
  "M6": "0€",
  "BFMTV": "0€",
  "CNews": "0€"
};

// Redundant source URLs and lists removed as links are being removed


// Inject subtle styling for the added links
const style = document.createElement('style');
style.textContent = `
  .papers-owners-suffix {
    opacity: 0.7;
    font-size: 0.9em;
    white-space: nowrap;
    display: inline;
  }

`;
document.head.appendChild(style);

let currentStyle = 'concise';
let matchDuEnabled = false;
let matchUppercaseEnabled = false;
let showPerMonthEnabled = false;
let showPerPersonEnabled = false;
let initialized = false;

const POPULATION_FRANCE = 68400000; // ~2024 population

// Function to initialize logic once style is known
function init() {
  if (initialized) return;
  initialized = true;

  const baseKeys = Object.keys(FUNDING_DATA);
  const searchTerms = new Set();

  baseKeys.forEach(originalName => {
    // 1. Original format
    searchTerms.add(originalName);

    // 2. Uppercase matching if enabled
    if (matchUppercaseEnabled) {
      searchTerms.add(originalName.toUpperCase());
    }

    // 3. "du/au" replacement if enabled
    if (matchDuEnabled && originalName.startsWith('Le ')) {
      const variants = [
        originalName.replace(/^Le /, 'du '),
        originalName.replace(/^Le /, 'Du '),
        originalName.replace(/^Le /, 'au '),
        originalName.replace(/^Le /, 'Au ')
      ];

      variants.forEach(variant => {
        searchTerms.add(variant);
        if (matchUppercaseEnabled) {
          searchTerms.add(variant.toUpperCase());
        }
      });
    }
  });

  const sortedTerms = Array.from(searchTerms).sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${sortedTerms.map(escapeRegExp).join('|')})\\b`, 'g');

  processNode(document.body, pattern);

  // Observe for mutations
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        processNode(node, pattern);
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Load preference and then init
chrome.storage.sync.get(['displayStyle', 'matchDu', 'matchUppercase', 'showPerMonth', 'showPerPerson'], (result) => {
  if (result.displayStyle) {
    currentStyle = result.displayStyle;
  }
  matchDuEnabled = !!result.matchDu;
  matchUppercaseEnabled = !!result.matchUppercase;
  showPerMonthEnabled = !!result.showPerMonth;
  showPerPersonEnabled = !!result.showPerPerson;
  init();
});

// Listen for updates
chrome.storage.onChanged.addListener((changes) => {
  if (changes.displayStyle || changes.matchDu || changes.matchUppercase || changes.showPerMonth || changes.showPerPerson) {
    // If user changes style or detection mode, we reload to start fresh
    location.reload();
  }
});

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseAmount(amountStr) {
  if (amountStr === "0€") return 0;

  const match = amountStr.match(/^(\d+(,\d+)?)(M€|Md€)$/);
  if (!match) return 0;

  let val = parseFloat(match[1].replace(',', '.'));
  if (match[3] === 'M€') {
    return val * 1000000;
  } else if (match[3] === 'Md€') {
    return val * 1000000000;
  }
  return 0;
}

function formatValue(value) {
  if (value === 0) return "0€";

  if (showPerPersonEnabled) {
    // Format as e.g. "0.12€"
    return value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€";
  }

  if (value >= 1000000000) {
    return (value / 1000000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + "Md€";
  }
  if (value >= 1000000) {
    return (value / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + "M€";
  }
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + "€";
}

function getFormattedSuffix(rawAmountStr) {
  let value = parseAmount(rawAmountStr);

  if (showPerPersonEnabled) {
    value = value / POPULATION_FRANCE;
  }

  if (showPerMonthEnabled) {
    value = value / 12;
  }

  const amount = formatValue(value);
  const period = showPerMonthEnabled ? "/mois" : "";
  const perPerson = showPerPersonEnabled ? "/hab" : "";
  const suffix = period + perPerson;

  switch (currentStyle) {
    case 'brackets':
      return ` [${amount}${suffix} public]`;
    case 'visual':
      return ` (💰 ${amount}${suffix})`;
    case 'minimalist':
      return ` (${amount}${suffix})`;
    case 'full':
      return ` (${amount}${suffix} d’argent public en 2024)`;
    case 'concise':
    default:
      return ` (${amount}${suffix} public '23)`;
  }
}

function processNode(node, pattern) {
  if (node.nodeType === 3) { // Text node
    const text = node.nodeValue;
    if (pattern.test(text)) {
      // Crude check to avoid re-processing nodes that already look like they have the data
      if (/[\(\[]?(💰 )?\d+(,\d+)?(M€|Md€).+[\)\]]?/.test(text)) return;

      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      pattern.lastIndex = 0; // Reset regex state improvements

      let changed = false;
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        // For matching with FUNDING_DATA, we need the original key.
        // We'll search for the key that matches fullMatch (case-insensitive or with "du" transform)
        let amount = FUNDING_DATA[fullMatch];

        if (!amount) {
          // If not direct match, find the original key
          const matchUpper = fullMatch.toUpperCase();
          const matchNoPrefix = fullMatch.replace(/^(du|Du|au|Au|DU|AU) /i, 'Le ');
          const matchNoPrefixUpper = matchNoPrefix.toUpperCase();

          amount = FUNDING_DATA[matchNoPrefix] ||
            FUNDING_DATA[Object.keys(FUNDING_DATA).find(k => k.toUpperCase() === matchUpper)] ||
            FUNDING_DATA[Object.keys(FUNDING_DATA).find(k => k.toUpperCase() === matchNoPrefixUpper)];
        }

        if (!amount) continue;

        // Check lookahead for existing info
        const lookahead = text.substring(match.index + fullMatch.length, match.index + fullMatch.length + 40);
        if (/[\(\[]?(💰 )?\d+(,\d+)?(M€|Md€)/.test(lookahead)) continue;

        changed = true;

        // Add text before the match
        fragment.appendChild(document.createTextNode(text.substring(lastIndex, match.index)));

        // Create a wrapper for the match to prevent re-processing
        const wrapper = document.createElement('span');
        wrapper.className = 'papers-owners-added';
        wrapper.style.display = 'inline';
        wrapper.textContent = fullMatch;

        // Create the suffix as a plain span (links removed as per request)
        const suffix = getFormattedSuffix(amount);
        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'papers-owners-suffix';
        suffixSpan.textContent = suffix;
        wrapper.appendChild(suffixSpan);


        fragment.appendChild(wrapper);

        lastIndex = pattern.lastIndex;
      }

      if (changed) {
        fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        node.parentNode.replaceChild(fragment, node);
      }
    }
  } else if (node.nodeType === 1) { // Element node
    // Skip scripts, styles, and our own added elements
    if (['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'NOSCRIPT'].includes(node.tagName) ||
      node.classList.contains('papers-owners-added') ||
      node.classList.contains('papers-owners-suffix')) {
      return;
    }

    // Process children. Convert to array to avoid issues with live NodeList during replaceChild
    Array.from(node.childNodes).forEach(child => processNode(child, pattern));
  }
}

// Initial logic is now handled in the init() function called after storage check

