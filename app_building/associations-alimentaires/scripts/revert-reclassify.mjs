import fs from 'fs';
import path from 'path';

const file = path.resolve('./src/data/aliments_ciqual.json');
const raw = JSON.parse(fs.readFileSync(file,'utf8'));

const ids = [
  'ciqual-11084','ciqual-11085','ciqual-5009','ciqual-5000','ciqual-18100','ciqual-18069','ciqual-18005','ciqual-11025','ciqual-11075','ciqual-11064','ciqual-5207','ciqual-18162','ciqual-18150','ciqual-18152','ciqual-5003','ciqual-5021','ciqual-5006','ciqual-5007','ciqual-5020','ciqual-11097','ciqual-11004','ciqual-11042','ciqual-11089','ciqual-11005','ciqual-11040','ciqual-18011','ciqual-18066','ciqual-11221','ciqual-11077','ciqual-11082','ciqual-7811','ciqual-7812','ciqual-11006','ciqual-11007','ciqual-11046','ciqual-11009','ciqual-11045','ciqual-11010','ciqual-11013','ciqual-11021','ciqual-11055','ciqual-5004','ciqual-11049','ciqual-11061','ciqual-11019','ciqual-11088','ciqual-11015','ciqual-18101','ciqual-18168','ciqual-18167','ciqual-42501','ciqual-18102','ciqual-11214','ciqual-11056','ciqual-11086','ciqual-42003','ciqual-18022','ciqual-11510','ciqual-5210','ciqual-5201','ciqual-5215','ciqual-5216','ciqual-5214','ciqual-11090','ciqual-11220'
];

let changed=0;
for(const entry of raw){
  if(ids.includes(entry.id) && entry.category !== 'autres'){
    entry.category = 'autres';
    changed++;
  }
}

fs.writeFileSync(file, JSON.stringify(raw,null,2),'utf8');
console.log('Restored', changed, 'items to category "autres"');
process.exit(0);
