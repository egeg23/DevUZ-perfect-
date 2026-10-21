# Набивка: цвет островов развёртки растягивается за их края, чтобы на швах не было трещин.
# Альфа — доля фото (1 — снято, 0 — внутренность, которой на снимках нет).
import cv2, numpy as np, sys
c=cv2.flip(cv2.imread(sys.argv[1],cv2.IMREAD_UNCHANGED),0).astype(np.float32); isl=cv2.flip(cv2.imread(sys.argv[2],0),0)>127
isl=cv2.erode(isl.astype(np.uint8),np.ones((3,3),np.uint8))>0
m=isl.astype(np.float32); col=c*m[...,None]
for i in range(24):
    b=cv2.blur(col,(3,3)); bm=cv2.blur(m,(3,3)); new=(bm>0)&(m==0)
    col[new]=b[new]/bm[new][:,None]; m[new]=1
cv2.imwrite(sys.argv[3],np.clip(col,0,255).astype(np.uint8))
