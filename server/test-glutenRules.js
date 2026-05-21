import { analyzeIngredients } from './lib/glutenRules.js';

const cases = [
  ['Safe gluten not detected', 'gluten not detected', 'NO_GLUTEN_DETECTED', [], []],
  ['Safe nutrition gluten not detected', 'Nutrition information: gluten not detected', 'NO_GLUTEN_DETECTED', [], []],
  ['Safe does not contain gluten', 'does not contain gluten', 'NO_GLUTEN_DETECTED', [], []],
  ['Safe gluten-free', 'gluten-free', 'NO_GLUTEN_DETECTED', [], []],
  ['Safe sans gluten', 'sans gluten', 'NO_GLUTEN_DETECTED', [], []],
  ['Direct contains gluten', 'contains gluten', 'CONTAINS_GLUTEN', ['gluten'], []],
  ['Warning may contain gluten', 'may contain gluten', 'POSSIBLE_RISK', [], ['may contain gluten']],
  ['Warning may contain traces of wheat', 'may contain traces of wheat', 'POSSIBLE_RISK', [], ['may contain traces of wheat']],
  ['Direct wheat flour', 'Ingredients: wheat flour, sugar', 'CONTAINS_GLUTEN', ['wheat flour'], []],
  ['Spanish safe', 'sin gluten', 'NO_GLUTEN_DETECTED'],
  ['Spanish direct', 'Ingredientes: harina de trigo, azúcar, sal', 'CONTAINS_GLUTEN'],
  ['Spanish warning', 'Puede contener trazas de trigo', 'POSSIBLE_RISK'],
  ['Spanish safe flour', 'Ingredientes: harina de garbanzo, agua, sal', 'NO_GLUTEN_DETECTED'],
  ['Spanish buckwheat exception', 'Ingredientes: harina de trigo sarraceno, azúcar', 'NO_GLUTEN_DETECTED'],
  ['Spanish generic flour', 'Ingredientes: harina, agua, sal', 'POSSIBLE_RISK'],
  ['Chinese safe', '无麸质', 'NO_GLUTEN_DETECTED'],
  ['Chinese direct', '配料：小麦粉，糖，盐', 'CONTAINS_GLUTEN'],
  ['Chinese warning', '可能含有微量小麦', 'POSSIBLE_RISK'],
  ['Chinese gluten not detected', '未检出麸质', 'NO_GLUTEN_DETECTED'],
  ['Chinese safe flour', '配料：鹰嘴豆粉，水，盐', 'NO_GLUTEN_DETECTED'],
  ['Chinese generic starch', '配料：淀粉，糖', 'POSSIBLE_RISK'],
  ['Chinese safe starch', '配料：玉米淀粉，糖', 'NO_GLUTEN_DETECTED'],
];

let failed = 0;

for (const [name, text, expected, expectedDetected = null, expectedPossible = null] of cases) {
  const result = analyzeIngredients(text);
  const detectedPassed = expectedDetected === null || expectedDetected.every((word) => result.detectedWords.includes(word));
  const possiblePassed = expectedPossible === null || expectedPossible.every((word) => result.possibleWords.includes(word));
  const noDetectedExpected = Array.isArray(expectedDetected) && expectedDetected.length === 0;
  const noDetectedPassed = !noDetectedExpected || result.detectedWords.length === 0;
  const passed = result.status === expected && detectedPassed && possiblePassed && noDetectedPassed;

  if (!passed) {
    failed += 1;
    console.error(`FAIL ${name}: expected ${expected}, got ${result.status}`);
    console.error(JSON.stringify(result, null, 2));
  } else {
    console.log(`OK ${name}: ${result.status}`);
  }
}

if (failed > 0) {
  process.exit(1);
}
