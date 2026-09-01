// contrast-check.mjs — vérification WCAG 2.1 (luminance relative) des couples texte/fond
// Usage : node contrast-check.mjs
const hex2rgb = h => {
  const m = h.replace('#', '');
  return [0, 2, 4].map(i => parseInt(m.slice(i, i + 2), 16) / 255);
};
const lin = c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = h => {
  const [r, g, b] = hex2rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const fmt = r => (Math.floor(r * 100) / 100).toFixed(2);
const check = (label, fg, bg, need = 4.5) => {
  const r = ratio(fg, bg);
  const ok = r >= need ? 'PASS' : 'FAIL';
  console.log(`${ok}  ${fmt(r)}:1  (min ${need})  ${label}  ${fg} sur ${bg}`);
};

console.log('— JOUR (fond chaux #F5F0E6) —');
check('bistre / chaux (texte courant)', '#1C1A17', '#F5F0E6');
check('candidat ocre-encre #8A6410', '#8A6410', '#F5F0E6');
check('candidat ocre-encre #7A5808', '#7A5808', '#F5F0E6');
check('candidat ocre-encre #6E5A10', '#6E5A10', '#F5F0E6');
check('candidat ocre-encre #6B4E07', '#6B4E07', '#F5F0E6');
check('candidat ocre-encre #715208', '#715208', '#F5F0E6');
check('sang #A63D2F (texte ?)', '#A63D2F', '#F5F0E6');
check('sang-encre candidat #8F3325', '#8F3325', '#F5F0E6');
check('sang-encre candidat #832E21', '#832E21', '#F5F0E6');
check('bleu-charrette #35566B (texte ?)', '#35566B', '#F5F0E6');
check('bleu-charrette-encre candidat #2C4859', '#2C4859', '#F5F0E6');
check('gris-ombre #7A756B (interdit texte)', '#7A756B', '#F5F0E6');
check('texte secondaire candidat #5C5648', '#5C5648', '#F5F0E6');
check('texte secondaire candidat #665F50', '#665F50', '#F5F0E6');
check('ocre-lumiere #C8951F (décoratif, info)', '#C8951F', '#F5F0E6');
console.log('\n— JOUR, grands textes / UI (min 3.0) —');
check('sang #A63D2F en display >=24px', '#A63D2F', '#F5F0E6', 3.0);
check('bleu-charrette #35566B filets/bordures UI', '#35566B', '#F5F0E6', 3.0);
check('ocre-encre #715208 pictos/bordures UI', '#715208', '#F5F0E6', 3.0);
console.log('\n— CTA plein (texte chaux sur aplat) —');
check('chaux sur ocre-encre #715208 (CTA)', '#F5F0E6', '#715208');
check('chaux sur ocre-encre #6B4E07 (CTA)', '#F5F0E6', '#6B4E07');
check('chaux sur bistre (CTA inverse)', '#F5F0E6', '#1C1A17');
check('bistre sur ocre-lumiere #C8951F (badge)', '#1C1A17', '#C8951F');
console.log('\n— NUIT (fond #14161A) —');
check('chaux / nuit (texte courant)', '#F5F0E6', '#14161A');
check('ocre désat #B08A3E (décoratif, info)', '#B08A3E', '#14161A');
check('ocre-nuit texte candidat #C9A24B', '#C9A24B', '#14161A');
check('ocre-nuit texte candidat #D4AF5E', '#D4AF5E', '#14161A');
check('sang-nuit candidat #D26A54', '#D26A54', '#14161A');
check('sang-nuit candidat #DC7B66', '#DC7B66', '#14161A');
check('bleu-nuit candidat #8FB0C4', '#8FB0C4', '#14161A');
check('texte secondaire nuit candidat #B5AE9F', '#B5AE9F', '#14161A');
check('texte secondaire nuit candidat #A8A190', '#A8A190', '#14161A');
console.log('\n— NUIT, grands textes / UI (min 3.0) —');
check('ocre désat #B08A3E en display', '#B08A3E', '#14161A', 3.0);
check('bleu-charrette #35566B filets nuit ?', '#35566B', '#14161A', 3.0);
check('bleu-nuit-filet candidat #4A7086', '#4A7086', '#14161A', 3.0);
console.log('\n— Surfaces secondaires —');
check('bistre sur chaux-creuse #EDE6D6', '#1C1A17', '#EDE6D6');
check('ocre-encre #715208 sur chaux-creuse', '#715208', '#EDE6D6');
check('chaux sur nuit-élevée #1C1F25', '#F5F0E6', '#1C1F25');
check('ocre-nuit #D4AF5E sur nuit-élevée', '#D4AF5E', '#1C1F25');
