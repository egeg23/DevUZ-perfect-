# Камеры (pnp.json) → cfg для bake.html. Снимки — в цвет главного фото, маски — с отступом.
# Машина симметрична: каждый снимок даёт и зеркальную камеру (z → −z, кадр отражён).
import cv2, numpy as np, json, sys
D=sys.argv[1]; size=int(sys.argv[2]); glb=sys.argv[3]
GAIN={'front':1.0,'rear':0.5}
ref=cv2.cvtColor(cv2.imread(f'{D}/front.png'),cv2.COLOR_BGR2LAB).astype(np.float32); refm=cv2.imread(f'{D}/front_m.png',0)>0
rs=(ref[refm].mean(0),ref[refm].std(0))
cams=json.load(open(f'{D}/pnp.json')); photos=[]
M=np.diag([1,1,-1.])
for n,g in GAIN.items():
    c=cams[n]; im=cv2.imread(f'{D}/{n}.png'); m=cv2.imread(f'{D}/{n}_m.png',0)>0; H,W=m.shape
    if n!='front':
        lab=cv2.cvtColor(im,cv2.COLOR_BGR2LAB).astype(np.float32); mu,sd=lab[m].mean(0),lab[m].std(0)
        lab[...,1:]=lab[...,1:]+(rs[0][1:]-mu[1:])*0.5
        lab[...,0]=(lab[...,0]-mu[0])/max(sd[0],1)*rs[1][0]*0.8+rs[0][0]
        im=cv2.cvtColor(np.clip(lab,0,255).astype(np.uint8),cv2.COLOR_LAB2BGR)
    er=cv2.erode(m.astype(np.uint8),np.ones((11,11),np.uint8)); soft=cv2.GaussianBlur(er.astype(np.float32),(0,0),4)
    for mir in (False,True):
        a=cv2.flip(im,1) if mir else im; s=cv2.flip(soft,1) if mir else soft
        tag=n+('_m' if mir else '')
        cv2.imwrite(f'{D}/b_{tag}.png',a); cv2.imwrite(f'{D}/b_{tag}_m.png',(s*255).astype(np.uint8))
        C=np.array(c['pos']); x,y,z=map(np.array,(c['x'],c['y'],c['z']))
        if mir: C,x,y,z=M@C,-(M@x),M@y,M@z
        photos.append({'name':tag,'img':f'{D}/b_{tag}.png','mask':f'{D}/b_{tag}_m.png','pos':C.tolist(),'x':x.tolist(),'y':y.tolist(),'z':z.tolist(),'fov':c['fov'],'W':W,'H':H,'gain':g*(0.85 if mir else 1),'power':6,'mirror':mir})
json.dump({'size':size,'glb':glb,'photos':photos,'lo':0.000001,'hi':0.0004},open(f'{D}/bake.json','w'))
print(len(photos))
