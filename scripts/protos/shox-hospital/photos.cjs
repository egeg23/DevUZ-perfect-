// Обработка снимков с shox.hospital: node photos.cjs <папка с исходниками> <public/clients/shox-hospital>
// Врачи — кадр 4:5 по голове, белый фон студии умножается на фирменную лаванду; лица не меняются.
const sharp=require('sharp');const R=process.argv[2],O=process.argv[3];
const slugs={d02:'yusubbaev',d03:'nortojiev',d04:'normamatov',d05:'abduganiev',d07:'kudratov',d08:'marufxodjaev',d09:'ganiev',d10:'ubaydullaev',d11:'kubaev',d12:'sagdullaev',d13:'mansurov',d14:'usmonov',d15:'ismatov',d16:'madaminova',d17:'yunusova',d18:'kutlieva',d19:'ibragimova',d20:'akbarova',d21:'nam',d22:'yakubova',d23:'rahmatova',d24:'ergasheva',d25:'hamdamova'};
(async()=>{
for(const [f,s] of Object.entries(slugs)){
  const img=sharp(`${R}/${f}`).flatten({background:'#ffffff'});
  const m=await sharp(`${R}/${f}`).metadata();
  const pos = f==='d02' ? sharp.strategy.attention : 'north';
  // Белый фон студии → фирменная бледная лаванда (умножение), лёгкий контраст.
  const base=await img.resize(480,600,{fit:'cover',position:pos}).linear(1.04,-4).modulate({saturation:1.04}).toBuffer();
  await sharp({create:{width:480,height:600,channels:3,background:'#ECEAF8'}}).composite([{input:base,blend:'multiply'}]).webp({quality:76}).toFile(`${O}/doctors/${s}.webp`);
  console.log(s,m.width+'x'+m.height);
}
const site=[['t_rt2.png','robot-arms.webp',900],['t_rt3.png','robot-console.webp',700],['t_photo.png','building-yakkasaroy.webp',1191],['t_filial1.png','branch-1.webp',576],['t_filial2.png','branch-2.webp',573],['t_filial3.png','branch-3.webp',573],['t_filial4.png','branch-4.webp',641]];
for(const [i,o,w] of site){await sharp(`${R}/${i}`).resize({width:w,withoutEnlargement:true}).webp({quality:80}).toFile(`${O}/site/${o}`);}
})();
