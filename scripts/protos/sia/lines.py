"""
Линии для заставки: фермы логотипа SIA и каркас виллы APx180.2606.

python3 -I lines.py <logo_footer.png> <apx180-2606-0.jpg>  (нужен opencv-python-headless)

Логотип — буквы из стальных ферм: скелет картинки и отрезки по нему
(HoughLinesP), координаты в точках логотипа 400×178. Дом — отрезки рендера
первого экрана (детектор LSD), самые длинные, в точках снимка 1500×837:
так каркас ложится ровно на чертёж и рендер, которые стоят под заставкой.
Пишет lines.json рядом: {"logo": [x1,y1,x2,y2,…] ×2, "house": [...]}.
"""
import json, os, sys
import cv2
import numpy as np

LOGO, HOUSE = sys.argv[1:3]
HERE = os.path.dirname(os.path.abspath(__file__))

im = cv2.imread(LOGO, cv2.IMREAD_UNCHANGED)
a = cv2.resize(im[:, :, 3], None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
_, m = cv2.threshold(a, 110, 255, cv2.THRESH_BINARY)
sk, el, t = np.zeros_like(m), cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3)), m.copy()
while cv2.countNonZero(t):
    er = cv2.erode(t, el)
    sk |= cv2.subtract(t, cv2.dilate(er, el))
    t = er
logo = cv2.HoughLinesP(sk, 1, np.pi / 360, threshold=14, minLineLength=14, maxLineGap=4).reshape(-1, 4) / 3.0

g = cv2.imread(HOUSE, cv2.IMREAD_GRAYSCALE)
H = cv2.createLineSegmentDetector(cv2.LSD_REFINE_STD).detect(cv2.GaussianBlur(g, (3, 3), 0))[0].reshape(-1, 4)
H = H[np.argsort(-np.hypot(H[:, 2] - H[:, 0], H[:, 3] - H[:, 1]))][:900]

pack = lambda arr, k: [int(round(v * k)) for v in arr.reshape(-1)]
json.dump({"logo": pack(logo, 2), "house": pack(H, 1), "logoSize": [400, 178], "houseSize": [g.shape[1], g.shape[0]]}, open(os.path.join(HERE, "lines.json"), "w"), separators=(",", ":"))
print(len(logo), "линий логотипа,", len(H), "линий дома")
