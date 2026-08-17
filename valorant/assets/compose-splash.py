"""
Compose a wide agent splash per agent, in the style of the reference:
atmospheric haze in the agent's colour, a big face close-up left, the full
painted figure right, and the signature ability motif floating.

Riot ships every one of these pieces separately and never assembled, and there
is no official wide art for the 13 launch agents at all — so this builds it.

Key decision: the haze fades to TRANSPARENT at the edges. The page these land
on is near-black, and a hard rectangle would read as a slideshow pasted onto
the layout. A vignetted alpha lets the art dissolve into the page the way
Qode's does, while still giving the "there is a background" weight that a bare
cut-out lacks.

LAYERS.  Each splash is also saved as four separate PNGs — haze / motif / face
/ figure — on the same WxH canvas, alpha-masked with the exact same final
vignette+edge mask as the flattened WebP. Stacked in that order at (0,0) they
reproduce the flattened image pixel-for-pixel; the front end uses that to run
a pointer-parallax loop across the four planes once the hover reveal settles,
without the planes ever drifting out of alignment with each other's edges.
"""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter

W, H = 1400, 788           # 16:9-ish, matches the intro carousel frame
OUT = sys.argv[1] if len(sys.argv) > 1 else 'splash'
os.makedirs(OUT, exist_ok=True)
os.makedirs(f'{OUT}-layers', exist_ok=True)

ags = {a['displayName']: a for a in json.load(open('agents.json'))['data']}
ORDER = ['Brimstone','Viper','Omen','Killjoy','Cypher','Sova','Sage',
         'Phoenix','Jett','Reyna','Raze','Breach','Skye']


def hexrgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def boost(rgb, f=1.9, floor=60):
    """The API's gradient colours are dark UI tints; lift them so the haze reads."""
    r, g, b = [min(255, int(c * f)) for c in rgb]
    m = max(r, g, b)
    if m < floor:                      # near-black agents (Cypher, Omen) need help
        k = floor / max(m, 1)
        r, g, b = [min(255, int(c * k)) for c in (r, g, b)]
    return (r, g, b)


def fractal_noise(w, h, octaves=4, seed=0):
    """Cheap multi-octave value noise -> soft cloud field in 0..1."""
    rng = np.random.default_rng(seed)
    acc = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        sw, sh = max(2, w >> (octaves - o)), max(2, h >> (octaves - o))
        layer = rng.random((sh, sw)).astype(np.float32)
        layer = np.array(Image.fromarray((layer * 255).astype(np.uint8))
                         .resize((w, h), Image.BICUBIC), np.float32) / 255.0
        acc += layer * amp
        total += amp
        amp *= 0.55
    acc /= total
    return (acc - acc.min()) / (np.ptp(acc) + 1e-6)


def vignette(w, h, cx=0.5, cy=0.5, rx=0.62, ry=0.66, feather=0.42):
    """Radial alpha falloff -> depth, darker toward the corners."""
    y, x = np.mgrid[0:h, 0:w].astype(np.float32)
    d = np.sqrt(((x / w - cx) / rx) ** 2 + ((y / h - cy) / ry) ** 2)
    a = np.clip((1.0 - d) / feather, 0, 1)
    return a ** 1.35


def edge_feather(w, h, fl=0.10, fr=0.05, ft=0.13, fb=0.15):
    """
    Ramp alpha to a hard zero along each border, independently.

    A radial vignette cannot do this job here: to reach zero at the bottom edge
    it has to be tight enough that it also eats the figure standing at the
    right edge. Feathering each side separately means the top and bottom seams
    dissolve completely — that is where a visible straight line betrays the art
    as a pasted rectangle — while the right side, which the layout bleeds off
    the viewport anyway, keeps almost its full width.
    """
    x = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    sm = lambda t: np.clip(t, 0, 1) ** 2 * (3 - 2 * np.clip(t, 0, 1))   # smoothstep
    ax = np.minimum(sm(x / fl), sm((1 - x) / fr))
    ay = np.minimum(sm(y / ft), sm((1 - y) / fb))
    return ax * ay


def paste_alpha(base, img, box, alpha=1.0):
    if alpha < 1.0:
        a = img.getchannel('A').point(lambda v: int(v * alpha))
        img = img.copy(); img.putalpha(a)
    base.alpha_composite(img, box)


def fit_h(img, target_h):
    w, h = img.size
    return img.resize((max(1, round(w * target_h / h)), target_h), Image.LANCZOS)


def build(name):
    a = ags[name]
    slug = name.lower()
    accent = boost(hexrgb('#' + a['backgroundGradientColors'][0][:6]))
    deep   = boost(hexrgb('#' + a['backgroundGradientColors'][2][:6]), 1.5)

    # Each plane is built on its own full-size transparent canvas, so all four
    # share one coordinate space and can be independently transformed later
    # without needing to know one another's offsets.
    haze_l   = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    motif_l  = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    face_l   = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    figure_l = Image.new('RGBA', (W, H), (0, 0, 0, 0))

    # ---- 1. haze -------------------------------------------------------------
    n = fractal_noise(W, H, seed=abs(hash(name)) % 9999)
    grad = np.linspace(0, 1, W, dtype=np.float32)[None, :].repeat(H, 0)
    field = np.clip(n * 0.78 + (1 - grad) * 0.35, 0, 1)

    col = np.zeros((H, W, 3), np.float32)
    for i in range(3):
        col[..., i] = deep[i] + (accent[i] - deep[i]) * field
    col *= (0.30 + 0.72 * field)[..., None]

    alpha = (0.24 + 0.88 * field) * vignette(W, H)
    haze = np.dstack([np.clip(col, 0, 255), np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    haze = Image.fromarray(haze, 'RGBA').filter(ImageFilter.GaussianBlur(9))
    haze_l.alpha_composite(haze)

    # ---- 2. signature ability motif, glowing upper-left ----------------------
    mp = f'src_motifs/{slug}.png'
    if os.path.exists(mp):
        m = Image.open(mp).convert('RGBA')
        m = fit_h(m, int(H * 0.30))
        tint = Image.new('RGBA', m.size, accent + (255,))
        tint.putalpha(m.getchannel('A'))
        glow = tint.filter(ImageFilter.GaussianBlur(18))
        pos = (int(W * 0.055), int(H * 0.12))
        paste_alpha(motif_l, glow, pos, 0.85)
        paste_alpha(motif_l, tint, pos, 0.55)

    # ---- 3. face close-up, melting into the haze ------------------------------
    fp = f'src_faces/{slug}.png'
    if os.path.exists(fp):
        f = Image.open(fp).convert('RGBA')
        f = fit_h(f, int(H * 1.22))
        fw, fh = f.size
        my, mx = np.mgrid[0:fh, 0:fw].astype(np.float32)
        mask = np.clip(1.25 - np.sqrt(((mx/fw - .5)/.52)**2 + ((my/fh - .46)/.58)**2) / .95, 0, 1) ** 1.2
        a = np.array(f.getchannel('A'), np.float32) / 255.0
        f.putalpha(Image.fromarray((a * mask * 255).astype(np.uint8)))
        paste_alpha(face_l, f, (int(W * 0.135), int(-H * 0.16)), 0.72)

    # ---- 4. the painted figure, right ------------------------------------------
    kp = f'keyart/{name}.png'
    if os.path.exists(kp):
        k = Image.open(kp).convert('RGBA')
        k = fit_h(k, int(H * 1.06))
        x = W - k.size[0] - int(W * 0.085)
        paste_alpha(figure_l, k, (x, int(-H * 0.02)))

    # ---- 5. one shared mask, applied identically to every plane ----------------
    v = np.clip(vignette(W, H, rx=0.78, ry=0.86, feather=0.34) * 1.35, 0, 1)
    e = edge_feather(W, H)
    mask = v * e

    def apply_mask(layer):
        a = np.array(layer.getchannel('A'), np.float32) / 255.0
        layer.putalpha(Image.fromarray((a * mask * 255).astype(np.uint8)))
        return layer

    for layer in (haze_l, motif_l, face_l, figure_l):
        apply_mask(layer)

    # flattened composite — carousel background + the shard-reveal source
    flat = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for layer in (haze_l, motif_l, face_l, figure_l):
        flat.alpha_composite(layer)
    flat.save(f'{OUT}/{slug}.webp', 'WEBP', quality=86, method=6)

    layer_bytes = 0
    for lname, layer in (('haze', haze_l), ('motif', motif_l), ('face', face_l), ('figure', figure_l)):
        p = f'{OUT}-layers/{slug}-{lname}.webp'
        layer.save(p, 'WEBP', quality=84, method=6)
        layer_bytes += os.path.getsize(p)

    return os.path.getsize(f'{OUT}/{slug}.webp'), layer_bytes


if __name__ == '__main__':
    tot_flat = tot_layers = 0
    for n in ORDER:
        fsz, lsz = build(n)
        tot_flat += fsz
        tot_layers += lsz
        print(f'  {n:10s} flat {fsz//1024:5d} KB   layers {lsz//1024:5d} KB')
    print(f'total flat {tot_flat//1024} KB, layers {tot_layers//1024} KB, for {len(ORDER)} agents')
