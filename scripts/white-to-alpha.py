#!/usr/bin/env python3
"""Turn the white background of a swirl image into real transparency.

The supplied swirl images carry a soft white haze: pixels that are nearly white
but still partly opaque. On the cream page that haze shows as a pale box around
the picture. This converts "how far from white" into the alpha channel (the
same idea as GIMP's Color to Alpha with white), then recovers the true colour
under it, so the gold stays gold and the white disappears. The result blends
into cream and also glows correctly on navy.

Usage:  python3 scripts/white-to-alpha.py SOURCE.webp OUTPUT.webp [strength]
        strength 1.0 is a straight conversion; above 1 makes faint haze vanish sooner.

The untouched originals are kept in docs/source-images/ (not part of the public site).
"""
import sys
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
strength = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

rgba = np.asarray(Image.open(src).convert("RGBA"), dtype=np.float64) / 255.0
a = rgba[..., 3:4]
# flatten onto white first, so existing partial alpha and white haze are treated alike
flat = rgba[..., :3] * a + (1.0 - a)
darkest = flat.min(axis=2, keepdims=True)           # 1.0 = pure white
alpha = np.clip((1.0 - darkest) * strength, 0.0, 1.0)
alpha[alpha < 0.012] = 0.0                           # drop sensor-noise level haze
safe = np.maximum(alpha, 1e-4)
color = np.clip((flat - (1.0 - alpha)) / safe, 0.0, 1.0)
result = np.concatenate([color, alpha], axis=2)
Image.fromarray((result * 255.0 + 0.5).astype(np.uint8), "RGBA").save(
    out, "WEBP", quality=90, method=6, exact=True
)
print(f"{out}: {Image.open(out).size}")
