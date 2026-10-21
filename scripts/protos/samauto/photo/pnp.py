# Опорные точки на модели и на снимках → камеры снимков (solvePnP).
# python3 -I pnp.py <растянутая модель: segment.py --whole>, из папки со снимками front/side/rear.png
import cv2, numpy as np, json, trimesh, sys
V=trimesh.load(sys.argv[1],force='mesh').vertices
K=0.407/1790; mid=(0.300-0.257)/2; FW=mid+3125*K/2; RW=mid-3125*K/2; WY=-0.127
def surf(p,mode,r=0.008):
    x,y,z=p
    if mode in 'RL': m=(abs(V[:,0]-x)<r)&(abs(V[:,1]-y)<r); 
    elif mode in 'FB': m=(abs(V[:,1]-y)<r)&(abs(V[:,2]-z)<r)
    elif mode=='U': m=(abs(V[:,0]-x)<r)&(abs(V[:,2]-z)<r)
    else: return np.array(p)
    if m.sum()==0: return surf(p,mode,r*2)
    W=V[m]; i={'R':np.argmax(W[:,2]),'L':np.argmin(W[:,2]),'F':np.argmax(W[:,0]),'B':np.argmin(W[:,0]),'U':np.argmax(W[:,1])}[mode]
    q=W[i].copy()
    if mode in 'RL': q[0],q[1]=x,y
    if mode in 'FB': q[1],q[2]=y,z
    if mode=='U': q[0],q[2]=x,z
    return q
P3={
 'hub_rf':((FW,WY,0),'R'),'hub_rr':((RW,WY,0),'R'),'hub_lf':((FW,WY,0),'L'),'hub_lr':((RW,WY,0),'L'),
 'logo':((0,0.021,0),'F'),'plate':((0,-0.096,0),'F'),
 'hl_r_out':((0.502,0.03,0.18),'X'),'hl_r_in':((0,0.003,0.11),'F'),'hl_l_out':((0.502,0.03,-0.18),'X'),
 'mir_r':((0.217,0.083,0),'R'),'mir_l':((0.217,0.083,0),'L'),
 'ant':((0.103,0.178,0),'X'),'ws_r':((0.138,0.165,0.149),'X'),'ws_l':((0.138,0.165,-0.149),'X'),
 'bed_r':((-0.574,0.069,0.2),'X'),'bed_l':((-0.574,0.069,-0.2),'X'),'cab_r':((-0.261,0.176,0.16),'X'),'cab_l':((-0.261,0.176,-0.16),'X'),
 'tl_r':((-0.553,0.021,0),'R'),'tl_l':((-0.553,0.021,0),'L'),'hl_l_tip':((0.564,0.021,0),'L'),'bmp_l':((0.585,-0.103,-0.17),'X'),
 'hd_rf':((0.023,0.0385,0),'R'),'hd_rr':((-0.209,0.045,0),'R'),'hd_lf':((0.023,0.0385,0),'L'),'hd_lr':((-0.209,0.045,0),'L'),
 'brake':((-0.258,0.178,0),'X'),
}
P3={k:surf(p,m) for k,(p,m) in P3.items()}
P2={
 'front':{'hub_rf':(690,715),'hub_rr':(245,645),'logo':(1195,425),'plate':(1210,672),'hl_r_out':(805,418),'hl_r_in':(995,460),'hl_l_out':(1415,445),
          'mir_r':(500,315),'mir_l':(1165,295),'ant':(797,172),'ws_r':(590,170),'ws_l':(1000,185),'bed_r':(155,345),'cab_r':(385,190)},
 'side':{'hub_lf':(438,568),'hub_lr':(1142,568),'hl_l_tip':(278,432),'mir_l':(620,350),'ws_l':(680,272),'cab_l':(1015,262),'bed_l':(1380,355),
          'tl_l':(1382,415),'bmp_l':(262,525),'hd_lf':(780,395),'hd_lr':(980,387)},
 'rear':{'tl_r':(665,420),'tl_l':(380,422),'bed_r':(698,372),'bed_l':(395,362),'hub_rr':(848,595),'hub_rf':(1166,530),'mir_r':(1120,360),
          'cab_r':(880,268),'hd_rf':(1035,398),'hd_rr':(935,393),'brake':(760,273)},
}
out={}
for n,pts in P2.items():
    H,W=cv2.imread(f'{n}.png').shape[:2]
    obj=np.array([P3[k] for k in pts],np.float64); img=np.array([pts[k] for k in pts],np.float64)
    best=None
    for fov in np.arange(6,50,0.5):
        f=(H/2)/np.tan(np.radians(fov)/2); Km=np.array([[f,0,W/2],[0,f,H/2],[0,0,1]])
        ok,rv,tv=cv2.solvePnP(obj,img,Km,None,flags=cv2.SOLVEPNP_SQPNP)
        if not ok: continue
        ok,rv,tv=cv2.solvePnP(obj,img,Km,None,rv,tv,True,flags=cv2.SOLVEPNP_ITERATIVE)
        pr,_=cv2.projectPoints(obj,rv,tv,Km,None); e=np.sqrt(((pr[:,0]-img)**2).sum(1))
        Rm,_=cv2.Rodrigues(rv)
        if (Rm@obj.T+tv)[2].min()<=0: continue
        if best is None or e.mean()<best[0]: best=(e.mean(),fov,rv,tv,e)
    err,fov,rv,tv,e=best
    Rm,_=cv2.Rodrigues(rv); C=(-Rm.T@tv).ravel()
    # OpenCV: x вправо, y вниз, z вперёд → three: x, -y, -z
    x=Rm[0]; y=-Rm[1]; z=-Rm[2]
    out[n]={'pos':C.tolist(),'x':x.tolist(),'y':y.tolist(),'z':z.tolist(),'fov':float(fov),'W':W,'H':H,'err':float(err)}
    print(n,'fov',fov,'err',round(err,1),'per pt',dict(zip(pts,np.round(e,1))))
json.dump(out,open('pnp.json','w'))
