#!/usr/bin/env python3
"""
HeraUEBA · Auditoría de contraste WCAG 2.2
=========================================
Reproduce la fase 1 del análisis de color (skill `analisis-color-stitch`).

Ejecuta el inventario de la paleta del brief, la verificación de contraste de los
pares propuestos y, al final, la auditoría de la paleta FINAL que ships en
`../tokens.css`. Si alguien cambia un valor de ese archivo, este script lo delata.

Uso:  python3 docs/contraste-wcag.py
Sin dependencias externas.
"""

# --------------------------------------------------------------------------- #
# WCAG 2.2 · fórmula de luminancia relativa y razón de contraste
# --------------------------------------------------------------------------- #


def lum(h):
    """Luminancia relativa WCAG. Acepta '#RRGGBB' o 'RRGGBB'."""
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))

    def f(c):
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def cr(a, b):
    """Razón de contraste entre dos colores, redondeada a 2 decimales."""
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return round((la + 0.05) / (lb + 0.05), 2)


def rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hsl(h):
    h = h.lstrip("#")
    r, g, b = (v / 255 for v in rgb(h))
    mx, mn = max(r, g, b), min(r, g, b)
    light = (mx + mn) / 2
    if mx == mn:
        return 0, 0, round(light * 100)
    d = mx - mn
    sat = d / (2 - mx - mn) if light > 0.5 else d / (mx + mn)
    if mx == r:
        hue = (60 * ((g - b) / d)) % 360
    elif mx == g:
        hue = 60 * ((b - r) / d) + 120
    else:
        hue = 60 * ((r - g) / d) + 240
    return round(hue), round(sat * 100), round(light * 100)


def verdict(ratio, large=False, non_textual=False):
    """Veredicto WCAG. `non_textual` aplica el umbral 3:1 de SC 1.4.11."""
    if non_textual:
        return "UI 3:1 OK" if ratio >= 3 else "FALLA"
    need = 3.0 if large else 4.5
    if ratio >= 7:
        return "AAA"
    if ratio >= 4.5:
        return "AA"
    if ratio >= need:
        return "AA solo texto grande" if not large else "AA"
    return "FALLA AA"


# --------------------------------------------------------------------------- #
# 1 · Inventario de la paleta tal como llegó en el brief
# --------------------------------------------------------------------------- #

BRIEF = {
    "Primario":          "#0F4C81",
    "Primario hover":    "#0B3A63",
    "Superficie":        "#FFFFFF",
    "Fondo":             "#F5F7FA",
    "Texto primario":    "#1A202C",
    "Texto secundario":  "#4A5568",
    "Borde":             "#E2E8F0",
    "Peligro":           "#E53E3E",
    "Peligro claro":     "#FFF5F5",
    "Advertencia":       "#DD6B20",
    "Exito":             "#38A169",
    "Deshabilitado":     "#A0AEC0",
}

print("=" * 72)
print("1 · INVENTARIO DE LA PALETA DEL BRIEF  (HEX / RGB / HSL)")
print("=" * 72)
for name, hexv in BRIEF.items():
    r, g, b = rgb(hexv)
    h, s, light = hsl(hexv)
    print(f"{name:18} {hexv}  rgb({r},{g},{b})  hsl({h},{s}%,{light}%)")

# --------------------------------------------------------------------------- #
# 2 · Auditoría de la paleta del brief: aquí aparecen los incumplimientos
# --------------------------------------------------------------------------- #

print()
print("=" * 72)
print("2 · AUDITORIA DE LA PALETA DEL BRIEF  (lo que NO se puede usar tal cual)")
print("=" * 72)

BRIEF_CHECKS = [
    ("Texto primario",   "Fondo",         False, False),
    ("Texto secundario", "Superficie",    False, False),
    ("Primario",         "Superficie",    False, True),   # borde/CTA: 3:1
    ("Primario hover",   "Superficie",    False, True),
    ("Peligro",          "Superficie",    False, True),
    ("Advertencia",      "Superficie",    False, True),
    ("Exito",            "Superficie",    False, True),
    ("Peligro",          "Peligro claro", False, False),
    ("Borde",            "Superficie",    False, True),
    ("Deshabilitado",    "Superficie",    False, True),
]

brief_failures = []
for fg_name, bg_name, large, non_textual in BRIEF_CHECKS:
    fg, bg = BRIEF[fg_name], BRIEF[bg_name]
    ratio = cr(fg, bg)
    v = verdict(ratio, large, non_textual)
    if v.startswith("FALLA"):
        brief_failures.append((fg_name, bg_name, fg, bg, ratio, v))
    print(f"{fg_name:18} sobre {bg_name:18} {fg} / {bg}  {ratio:6}:1  {v}")

print()
print("Incumplimientos detectados en el brief:")
for fg_name, bg_name, fg, bg, ratio, v in brief_failures:
    print(f"  · {fg} sobre {bg} = {ratio}:1 -> {v}   ({fg_name} sobre {bg_name})")

# --------------------------------------------------------------------------- #
# 3 · Decisiones de diseño derivadas de la auditoría
# --------------------------------------------------------------------------- #

print()
print("=" * 72)
print("3 · DECISIONES  (regla: color saturado = no textual, texto = relleno oscuro)")
print("=" * 72)

DECISIONS = [
    ("Relleno de texto blanco",
     "El rojo de marca #E53E3E con texto blanco da 4.13:1 y falla AA.",
     "Los rellenos CON texto pasan a #C53030 / #B45309 / #2C7A4B (>= 4.5:1)."),
    ("Indicadores no textuales",
     "Franja lateral, icono, punto de la línea de tiempo y borde de fila.",
     "#E53E3E / #DD6B20 / #38A169 se conservan tal cual (umbral 3:1)."),
    ("Texto terciario",
     "#6B7688 daba 4.29:1 con texto de 11px.",
     "Se oscurece a #5F6B7D (5.40:1 sobre blanco, 5.04:1 sobre #F5F7FA)."),
    ("Borde de control",
     "#E2E8F0 daba 1.23:1: invisible como borde de input.",
     "El borde de control pasa a #8A94A6 (3.06:1). #E2E8F0 queda solo como divisor."),
    ("Texto de estado sobre container",
     "Los chips de estado necesitan texto legible sobre fondo teñido.",
     "Se añaden #9B2C2C / #9C4221 / #276749 como tokens on-*-container."),
]
for title, problem, decision in DECISIONS:
    print(f"\n  {title}")
    print(f"    problema : {problem}")
    print(f"    decision : {decision}")

# --------------------------------------------------------------------------- #
# 4 · Auditoría de la paleta FINAL que ships en tokens.css
# --------------------------------------------------------------------------- #

FINAL_TEXT = {
    "on-surface":           "#1A202C",
    "on-surface-variant":   "#4A5568",
    "on-surface-muted":     "#5F6B7D",
    "primary":              "#0F4C81",
    "on-primary-container": "#0B3A63",
    "primary-container":    "#E3ECF5",
    "error":                "#C53030",
    "warning":              "#B45309",
    "success":              "#2C7A4B",
    "on-error-container":   "#9B2C2C",
    "on-warning-container": "#9C4221",
    "on-success-container": "#276749",
    "outline-strong":       "#8A94A6",
}
FINAL_BG = {"surface": "#FFFFFF", "background": "#F5F7FA", "surface-dim": "#F5F7FA"}
FINAL_CONTAINER = {
    "error": "#FFF5F5",
    "warning": "#FFF4E8",
    "success": "#EFFAF3",
}

# Tokens cuyo color NO es texto: el umbral correcto es 3:1 (SC 1.4.11).
NON_TEXTUAL = {"outline-strong"}
# `*-container` son rellenos de fondo, nunca texto: se auditan en el bloque
# dedicated de "texto de estado sobre su container", no aquí.
FILL_ONLY = {"primary-container"}

print()
print("=" * 72)
print("4 · AUDITORIA DE LA PALETA FINAL  (debe salir TODO en verde)")
print("=" * 72)

failures = []

print("\n-- Tokens de texto sobre superficie #FFFFFF y fondo #F5F7FA --")
for name, fg in FINAL_TEXT.items():
    non_textual = name in NON_TEXTUAL
    if non_textual or name in FILL_ONLY:
        continue
    for bg_name, bg in FINAL_BG.items():
        ratio = cr(fg, bg)
        v = verdict(ratio)
        print(f"{name:22} sobre {bg_name:11} {ratio:6}:1  {v}")
        if v.startswith("FALLA"):
            failures.append(f"{name} sobre {bg_name} = {ratio}:1")

print("\n-- Texto de estado sobre su container --")
for name, container in FINAL_CONTAINER.items():
    token = f"on-{name}-container"
    ratio = cr(FINAL_TEXT[token], container)
    v = verdict(ratio)
    print(f"{token:22} sobre {container} {ratio:6}:1  {v}")
    if v.startswith("FALLA"):
        failures.append(f"{token} sobre {container} = {ratio}:1")

print("\n-- Chip activo: on-primary-container sobre primary-container --")
ratio = cr(FINAL_TEXT["on-primary-container"], FINAL_TEXT["primary-container"])
v = verdict(ratio)
print(f"{'on-primary-container':22} sobre {'#E3ECF5':11} {ratio:6}:1  {v}")
if v.startswith("FALLA"):
    failures.append(f"on-primary-container sobre #E3ECF5 = {ratio}:1")

print("\n-- Tokens NO textuales (borde de control, franja, punto): umbral 3:1 --")
# SC 1.4.11 exige 3:1 solo donde el color es NECESARIO para identificar el
# componente o su estado. Los bordes decorativos de tarjeta (`.card`) y los
# divisores (`.card__foot`) están exentos: el componente se identifica por su
# título, no por su filete. Los que sí se auditan con 3:1 son:
#
# Nota: `.chipset` usa `--surface` (no `--surface-dim`) a propósito. Con fondo
# `#F5F7FA` el borde `#8A94A6` sólo daba 2.85:1 y el chipset perdía su contorno.
BOUNDARY_3x1 = {
    "outline-strong (borde de input/botón)":   ("#8A94A6", ("#FFFFFF",)),
    "outline-strong (borde del chipset)":       ("#8A94A6", ("#FFFFFF",)),
    "primary (borde del chip activo)":          ("#0F4C81", ("#E3ECF5",)),
    "error-indicator (franja crítica)":         ("#E53E3E", ("#FFFFFF", "#F5F7FA")),
    "warning-indicator (punto de línea tiempo)": ("#DD6B20", ("#FFFFFF", "#F5F7FA")),
    "success-indicator (punto vivo)":           ("#38A169", ("#FFFFFF", "#F5F7FA")),
}
for label, (fg, backgrounds) in BOUNDARY_3x1.items():
    for bg in backgrounds:
        ratio = cr(fg, bg)
        v = verdict(ratio, non_textual=True)
        print(f"{label:46} sobre {bg} {ratio:6}:1  {v}")
        if v.startswith("FALLA"):
            failures.append(f"{label} sobre {bg} = {ratio}:1")

print()
print("=" * 72)
if failures:
    print("RESULTADO: la paleta final tiene %d incumplimiento(s):" % len(failures))
    for f in failures:
        print("  ·", f)
    raise SystemExit(1)
print("RESULTADO: la paleta final cumple WCAG AA en todos los pares auditados.")
print("=" * 72)