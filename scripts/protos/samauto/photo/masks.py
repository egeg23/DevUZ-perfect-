# Снимки и маски машины: python3 -I masks.py <docs/research/samauto> <папка вывода>
# Фото с сайта — на белом, маска порогом; рендеры презентации — GrabCut по рамке.
import cv2, numpy as np, sys
R, D = sys.argv[1] + '/', sys.argv[2] + '/'
def load(p, w=1600):
    im = cv2.imread(R + p, cv2.IMREAD_UNCHANGED)[:, :, :3]
    return cv2.resize(im, (w, round(im.shape[0] * w / im.shape[1])), interpolation=cv2.INTER_AREA)
def biggest(m):
    n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8)); m = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); m = np.zeros_like(m); cv2.drawContours(m, cnts, -1, 1, -1); return m
f = load('sayt/dmax-irbis-orange.webp'); cv2.imwrite(D + 'front.png', f)
g = f.astype(int); m = ~((g.min(2) > 170) & (g.max(2) - g.min(2) < 22))
cv2.imwrite(D + 'front_m.png', biggest(cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))) * 255)
for name, file, rect in [('side', 'kadry/04-turntable.webp', (0.16, 0.27, 0.88, 0.73)), ('rear', 'kadry/13-rear.webp', (0.22, 0.28, 0.77, 0.76))]:
    im = load(file); cv2.imwrite(D + name + '.png', im); H, W = im.shape[:2]
    r = (int(rect[0] * W), int(rect[1] * H), int((rect[2] - rect[0]) * W), int((rect[3] - rect[1]) * H))
    mask = np.zeros((H, W), np.uint8); cv2.grabCut(im, mask, r, np.zeros((1, 65)), np.zeros((1, 65)), 6, cv2.GC_INIT_WITH_RECT)
    mm = (mask == 1) | (mask == 3)
    if name == 'rear':  # серый угол стены за капотом
        a = im.astype(int); mm &= ~(((a.max(2) - a.min(2)) < 18) & (a.max(2) > 45))
    cv2.imwrite(D + name + '_m.png', biggest(cv2.morphologyEx(mm.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))) * 255)
