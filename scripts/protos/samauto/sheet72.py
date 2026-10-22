"""Проверка перекраски стенда D-MAX: лист всех кадров в одном цвете.

python3 -I sheet72.py <файл с ключом hex> public/protos/samauto/tt/d out.jpg tt.json [кадры через запятую] [цвет hex]

Расшифровывает кадры стенда ключом SCENE_KEY_SAMAUTO (файл с ключом — вне
репозитория), красит кузов тем же расчётом, что шейдер в page.js, и
складывает кадры в один лист. Пятно другого цвета видно сразу.
"""
import os, sys, json, io, numpy as np
from PIL import Image
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
K = bytes.fromhex(open(sys.argv[1]).read().strip()); D = sys.argv[2]; OUT = sys.argv[3]
ref = json.load(open(sys.argv[4]))['ref']
def ss(a,b,x):
    t=np.clip((x-a)/(b-a),0,1); return t*t*(3-2*t)
def hsv(c):
    mx,mn=c.max(-1),c.min(-1);d=mx-mn+1e-6;r,g,b=c[...,0],c[...,1],c[...,2]
    h=np.where(mx==r,((g-b)/d)%6,np.where(mx==g,(b-r)/d+2,(r-g)/d+4))/6
    return h,d/(mx+1e-6),mx
tc=np.array([(int(sys.argv[6] if len(sys.argv)>6 else '1f4f9c'[i:i+2],16)/255)**2.2 for i in (0,2,4)])
tiles=[];SEL=[int(x) for x in sys.argv[5].split(",")] if len(sys.argv)>5 else range(72)
for i in SEL:
    raw=open(os.path.join(D,f'{i:02d}.bin'),'rb').read()
    im=Image.open(io.BytesIO(AESGCM(K).decrypt(raw[:12],raw[12:],None))).convert('RGB')
    a=np.asarray(im,dtype=np.float32)/255; H=a.shape[0]*2//3; W=a.shape[1]
    c=a[:H]; mk=np.asarray(Image.fromarray((a[H:,:W//2]*255).astype('uint8')).resize((W,H)),dtype=np.float32)[...,0]/255
    mp=ss(.08,.92,mk)[...,None]; l=c**2.2
    y=(l*[.2126,.7152,.0722]).sum(-1,keepdims=True)/ref['paint']; o=tc*y; o=o/(1+np.maximum(0,o.max(-1,keepdims=True)-.85)*1.4)+np.maximum(0,y-1.6)*.06
    out=l*(1-mp)+o*mp
    tiles.append(Image.fromarray((np.clip(out,0,1)**(1/2.2)*255).astype('uint8')).resize((800,450)) if len(sys.argv)>5 else Image.fromarray((np.clip(out,0,1)**(1/2.2)*255).astype("uint8")).resize((320,180)))
tw,th=tiles[0].size;cols=9 if len(tiles)>8 else 2
S=Image.new('RGB',(tw*cols,th*((len(tiles)+cols-1)//cols)))
for i,t in enumerate(tiles): S.paste(t,((i%cols)*tw,(i//cols)*th))
S.save(OUT,quality=82)
