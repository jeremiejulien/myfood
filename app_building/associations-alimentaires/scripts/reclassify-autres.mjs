import fs from 'fs';
import path from 'path';

const file = path.resolve('./src/data/aliments_ciqual.json');
const raw = JSON.parse(fs.readFileSync(file,'utf8'));

const rules = [
  {re:/\b(bi[èe]re|panach|vin|champagne|cidre)\b/i, cat:'sucreries'},
  {re:/\beau\b/i, cat:'eau'},
  {re:/\b(th[ée]|tisane|cafe|chicor[eé]e|cacao|poudre cacaot|poudre cacaot[eé])\b/i, cat:'eau'},
  {re:/\b(poudre cacaot|poudre malt|poudre cacaot[eé]|cacao)\b/i, cat:'sucreries'},
  {re:/\b(focaccia|fougasse|vermicelles|pain|farine|farine d'|farine d epeautre|farine)\b/i, cat:'amidons'},
  {re:/\b(spiruline|gelatin|gélatine|extrait de levure|levure de boulanger|levure de bière|levure)\b/i, cat:'proteines_maigres'},
  {re:/\b(l[eè]cithine|lecithine)\b/i, cat:'lipides'},
  {re:/\b(pavot|graine(?:s)?|huile)\b/i, cat:'lipides'},
  {re:/\b(fleur de sel|sel)\b/i, cat:'sel'},
  {re:/\b(oignon|cornichon|c[âa]pres|c[aâ]pres)\b/i, cat:'legumes_amidon_faible'},
  {re:/\b(moutarde)\b/i, cat:'lipides'},
  {re:/\b(agar|algue)\b/i, cat:'amidons'},
  {re:/\b(substitut de repas|substitut|preparation culinaire a base de soja|cr[èe]me de soja|creme de soja)\b/i, cat:'proteines_maigres'},
  {re:/\b(poudre|preparation culinaire|preparation)\b/i, cat:'sucreries'},
];

const items = raw.filter(x=>x.category==='autres');
const changed = [];

for(const item of items){
  const label = (item.label||'').toLowerCase();
  let assigned = null;
  for(const r of rules){
    if(r.re.test(label)){
      assigned = r.cat; break;
    }
  }
  if(!assigned){
    // fallback heuristics
    if(/\b(epice|épice|cannelle|cardamome|curcuma|poivre|paprika|safran|gingembre|clou)\b/i.test(label)) assigned='autres';
    else assigned='autres';
  }
  if(assigned!==item.category){
    changed.push({id:item.id,label:item.label,from:item.category,to:assigned});
    item.category = assigned;
  }
}

fs.writeFileSync(file, JSON.stringify(raw,null,2),'utf8');

console.log('Processed', items.length, 'items. Changed:', changed.length);
for(const c of changed) console.log(c.id,'|',c.label,'=>',c.to);

const summary = {};
for(const c of changed) summary[c.to]=(summary[c.to]||0)+1;
console.log('Summary:', summary);

process.exit(0);
