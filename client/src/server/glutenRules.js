const labels = {
  CONTAINS_GLUTEN: 'Contient du gluten',
  POSSIBLE_RISK: 'Risque possible',
  NO_GLUTEN_DETECTED: 'Aucun gluten detecte',
  INSUFFICIENT_INFO: 'Information insuffisante',
};

const messages = {
  CONTAINS_GLUTEN: 'Des ingredients directement lies au gluten ont ete detectes.',
  POSSIBLE_RISK: 'Des termes ambigus ou lies aux traces possibles ont ete detectes.',
  NO_GLUTEN_DETECTED: 'Aucun mot surveille lie au gluten n a ete detecte dans le texte analyse.',
  INSUFFICIENT_INFO: 'Le texte fourni est trop court pour une analyse fiable.',
};

const safeClaimTerms = [
  'sans gluten',
  'ne contient pas de gluten',
  'ne contient pas gluten',
  'gluten non detecte',
  'absence de gluten',
  'exempt de gluten',
  'gluten free',
  'free from gluten',
  'no gluten',
  'contains no gluten',
  'does not contain gluten',
  'gluten not detected',
  'not detected gluten',
  'gluten undetected',
  'gluten absent',
  'absent gluten',
  'sin gluten',
  'libre de gluten',
  'no contiene gluten',
  'gluten no detectado',
  'ausencia de gluten',
  'exento de gluten',
  '无麸质',
  '不含麸质',
  '麸质未检出',
  '未检出麸质',
  '不含面筋',
  '无面筋',
];

const safeExceptionTerms = [
  'farine de pois chiches',
  'farine de riz',
  'farine de mais',
  'farine de sarrasin',
  'farine de quinoa',
  'farine de lentilles',
  'farine de soja',
  'farine de pomme de terre',
  'farine de tapioca',
  'farine de manioc',
  'farine de chataigne',
  'farine d amande',
  'farine de coco',
  'chickpea flour',
  'rice flour',
  'corn flour',
  'maize flour',
  'buckwheat flour',
  'quinoa flour',
  'lentil flour',
  'soy flour',
  'potato flour',
  'tapioca flour',
  'cassava flour',
  'chestnut flour',
  'almond flour',
  'coconut flour',
  'harina de garbanzo',
  'harina de arroz',
  'harina de maiz',
  'harina de alforfon',
  'harina de trigo sarraceno',
  'harina de quinoa',
  'harina de lentejas',
  'harina de soja',
  'harina de patata',
  'harina de papa',
  'harina de tapioca',
  'harina de yuca',
  'harina de castana',
  'harina de almendra',
  'harina de coco',
  'amidon de mais',
  'corn starch',
  'potato starch',
  'almidon de maiz',
  'almidon de patata',
  'almidon de papa',
  '鹰嘴豆粉',
  '米粉',
  '玉米粉',
  '荞麦粉',
  '藜麦粉',
  '扁豆粉',
  '大豆粉',
  '土豆粉',
  '马铃薯粉',
  '土豆淀粉',
  '马铃薯淀粉',
  '玉米淀粉',
  '木薯粉',
  '栗子粉',
  '杏仁粉',
  '椰子粉',
];

const directTerms = [
  'farine de ble',
  'amidon de ble',
  'proteines de ble',
  'gluten de ble',
  'semoule de ble',
  'extrait de malt',
  'ble',
  'orge',
  'seigle',
  'triticale',
  'epeautre',
  'froment',
  'kamut',
  'malt',
  'chapelure',
  'couscous',
  'boulghour',
  'boulgour',
  'seitan',
  'gluten',
  'wheat flour',
  'wheat starch',
  'wheat protein',
  'wheat gluten',
  'malt extract',
  'wheat bran',
  'wheat',
  'barley',
  'rye',
  'spelt',
  'malted',
  'durum',
  'semolina',
  'breadcrumbs',
  'bulgur',
  'bran',
  'harina de trigo',
  'almidon de trigo',
  'proteina de trigo',
  'gluten de trigo',
  'extracto de malta',
  'semola de trigo',
  'pan rallado',
  'salvado de trigo',
  'trigo',
  'cebada',
  'centeno',
  'espelta',
  'malta',
  'malteado',
  'cuscus',
  'seitan',
  'contains gluten',
  'with gluten',
  'gluten ingredient',
  'contiene gluten',
  'con gluten',
  '小麦面粉',
  '小麦淀粉',
  '小麦蛋白',
  '小麦麸质',
  '含有麸质',
  '含麸质',
  '含有面筋',
  '含面筋',
  '麦芽提取物',
  '粗粒小麦粉',
  '斯佩尔特小麦',
  '卡姆小麦',
  '小麦粉',
  '小麦',
  '大麦',
  '黑麦',
  '小黑麦',
  '麦芽精',
  '麦芽',
  '粗面粉',
  '面包屑',
  '库斯库斯',
  '布格麦',
  '面筋',
  '麸质',
];

const possibleTerms = [
  'traces de gluten',
  'traces de ble',
  'peut contenir du gluten',
  'peut contenir gluten',
  'peut contenir des traces de gluten',
  'peut contenir des traces de ble',
  'peut contenir',
  'traces',
  'fabrique dans un atelier',
  'atelier utilisant',
  'contamination croisee',
  'risque de traces',
  'avoine',
  'aromes',
  'maltodextrine',
  'may contain traces',
  'may contain gluten',
  'may contain wheat',
  'may contain traces of gluten',
  'may contain traces of wheat',
  'traces of gluten',
  'traces of wheat',
  'may contain',
  'made in a facility',
  'produced in a facility',
  'facility that also processes',
  'cross contamination',
  'cross-contamination',
  'oats',
  'oat',
  'flavoring',
  'flavouring',
  'maltodextrin',
  'puede contener trazas',
  'puede contener gluten',
  'puede contener trigo',
  'puede contener trazas de gluten',
  'puede contener trazas de trigo',
  'trazas de gluten',
  'trazas de trigo',
  'puede contener',
  'fabricado en una fabrica',
  'elaborado en una fabrica',
  'producido en una fabrica',
  'contaminacion cruzada',
  'avena',
  'aromas',
  'saborizantes',
  'maltodextrina',
  '可能含有微量',
  '可能含有痕量',
  '可能含有麸质',
  '可能含有面筋',
  '可能含有小麦',
  '可能含有微量麸质',
  '可能含有微量小麦',
  '可能含有痕量麸质',
  '可能含有痕量小麦',
  '可能含有',
  '微量麸质',
  '痕量麸质',
  '微量小麦',
  '痕量小麦',
  '交叉污染',
  '同一生产线',
  '同一设备',
  '生产线也处理',
  '可能接触',
  '燕麦',
  '香料',
  '调味料',
  '麦芽糊精',
];

const warningClaimTerms = [
  'peut contenir du gluten',
  'peut contenir gluten',
  'peut contenir des traces de gluten',
  'peut contenir des traces de ble',
  'traces de gluten',
  'traces de ble',
  'may contain gluten',
  'may contain wheat',
  'may contain traces of gluten',
  'may contain traces of wheat',
  'traces of gluten',
  'traces of wheat',
  'puede contener gluten',
  'puede contener trigo',
  'puede contener trazas de gluten',
  'puede contener trazas de trigo',
  'trazas de gluten',
  'trazas de trigo',
  '可能含有麸质',
  '可能含有面筋',
  '可能含有小麦',
  '可能含有微量麸质',
  '可能含有微量小麦',
  '可能含有痕量麸质',
  '可能含有痕量小麦',
  '微量麸质',
  '痕量麸质',
  '微量小麦',
  '痕量小麦',
];

const genericRiskTerms = [
  'farine',
  'flour',
  'harina',
  'amidon',
  'starch',
  'almidon',
  '面粉',
  '淀粉',
];

const warningStarters = [
  'peut contenir',
  'traces',
  'risque de traces',
  'may contain',
  'traces of',
  'puede contener',
  'trazas de',
  '可能含有',
  '可能含有微量',
  '可能含有痕量',
  '微量',
  '痕量',
  '可能接触',
  '生产线也处理',
];

const chinesePattern = /[\u3400-\u9fff]/;

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizePhrase(value = '') {
  return normalizeText(value);
}

function hasChinese(value = '') {
  return chinesePattern.test(value);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function latinTermRegex(term) {
  const pattern = escapeRegex(term).replace(/[\s-]+/g, '[\\s-]+');
  return new RegExp(`(^|[^a-z0-9])(${pattern})(?=[^a-z0-9]|$)`, 'iu');
}

function sortedTerms(terms) {
  return [...terms].map(normalizePhrase).sort((a, b) => b.length - a.length);
}

function findPhraseMatches(normalizedText, terms) {
  const matches = [];

  for (const term of sortedTerms(terms)) {
    if (!term) continue;

    if (hasChinese(term)) {
      let start = normalizedText.indexOf(term);
      while (start !== -1) {
        matches.push({ term, start, end: start + term.length });
        start = normalizedText.indexOf(term, start + term.length);
      }
      continue;
    }

    const regex = latinTermRegex(term);
    const match = normalizedText.match(regex);
    if (match?.index !== undefined) {
      const prefixLength = match[1]?.length || 0;
      const start = match.index + prefixLength;
      matches.push({ term, start, end: start + term.length });
    }
  }

  return matches;
}

function removeRanges(text, ranges) {
  if (!ranges.length) return text;
  const chars = [...text];
  for (const range of ranges) {
    for (let index = Math.max(0, range.start); index < Math.min(chars.length, range.end); index += 1) {
      chars[index] = ' ';
    }
  }
  return chars.join('').replace(/\s+/g, ' ').trim();
}

function warningContextRanges(normalizedText) {
  const ranges = [];
  const matches = findPhraseMatches(normalizedText, warningStarters);

  for (const match of matches) {
    if (hasChinese(match.term)) {
      ranges.push({ start: match.start, end: Math.min(normalizedText.length, match.end + 14) });
      continue;
    }

    const tail = normalizedText.slice(match.end);
    const extra = tail.match(/^((?:\s+[a-z0-9]+){0,10})/iu)?.[0]?.length || 0;
    ranges.push({ start: match.start, end: match.end + extra });
  }

  return ranges;
}

export function normalizeText(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’`´']/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function findSafeClaims(normalizedText) {
  return unique(findPhraseMatches(normalizedText, safeClaimTerms).map((match) => match.term));
}

export function removeSafeClaimPhrases(normalizedText) {
  const safeRanges = findPhraseMatches(normalizedText, safeClaimTerms);
  return removeRanges(normalizedText, safeRanges);
}

export function findWarningClaims(normalizedText) {
  return unique(findPhraseMatches(normalizedText, warningClaimTerms).map((match) => match.term));
}

function createRiskSearchText(normalizedText) {
  const safeRanges = findPhraseMatches(normalizedText, safeClaimTerms);
  const warningClaimRanges = findPhraseMatches(normalizedText, warningClaimTerms);
  const exceptionRanges = findPhraseMatches(normalizedText, safeExceptionTerms);
  const warningRanges = warningContextRanges(normalizedText);
  return removeRanges(normalizedText, [...safeRanges, ...warningClaimRanges, ...exceptionRanges, ...warningRanges]);
}

export function findDirectGlutenTerms(normalizedText) {
  const searchableText = createRiskSearchText(normalizedText);
  return unique(findPhraseMatches(searchableText, directTerms).map((match) => match.term));
}

export function findPossibleRiskTerms(normalizedText) {
  const searchableText = removeRanges(normalizedText, findPhraseMatches(normalizedText, safeClaimTerms));
  return unique(findPhraseMatches(searchableText, possibleTerms).map((match) => match.term));
}

export function detectGenericFlourRisk(normalizedText) {
  const withoutSafe = removeRanges(normalizedText, [
    ...findPhraseMatches(normalizedText, safeClaimTerms),
    ...findPhraseMatches(normalizedText, safeExceptionTerms),
  ]);
  return unique(findPhraseMatches(withoutSafe, genericRiskTerms).map((match) => match.term));
}

export function analyzeIngredients(text = '') {
  const normalizedText = normalizeText(text);
  const safeClaims = findSafeClaims(normalizedText);

  if (!normalizedText) {
    return {
      status: 'INSUFFICIENT_INFO',
      label: labels.INSUFFICIENT_INFO,
      detectedWords: [],
      possibleWords: [],
      safeClaims,
      confidence: 'low',
      normalizedText,
      message: messages.INSUFFICIENT_INFO,
    };
  }

  const warningClaims = findWarningClaims(normalizedText);
  const possibleWords = unique([...warningClaims, ...findPossibleRiskTerms(normalizedText), ...detectGenericFlourRisk(normalizedText)]);
  const detectedWords = findDirectGlutenTerms(normalizedText);

  if (detectedWords.length > 0) {
    return {
      status: 'CONTAINS_GLUTEN',
      label: labels.CONTAINS_GLUTEN,
      detectedWords,
      possibleWords,
      safeClaims,
      confidence: 'high',
      normalizedText,
      message: messages.CONTAINS_GLUTEN,
    };
  }

  if (possibleWords.length > 0) {
    return {
      status: 'POSSIBLE_RISK',
      label: labels.POSSIBLE_RISK,
      detectedWords: [],
      possibleWords,
      safeClaims,
      confidence: 'medium',
      normalizedText,
      message: messages.POSSIBLE_RISK,
    };
  }

  return {
    status: 'NO_GLUTEN_DETECTED',
    label: labels.NO_GLUTEN_DETECTED,
    detectedWords: [],
    possibleWords: [],
    safeClaims,
    confidence: normalizedText.length > 80 ? 'high' : 'medium',
    normalizedText,
    message: messages.NO_GLUTEN_DETECTED,
  };
}
