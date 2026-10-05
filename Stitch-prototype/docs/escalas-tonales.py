import colorsys
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted((lum(a),lum(b)),reverse=True); return round((la+0.05)/(lb+0.05),2)
def tohex(h,s,l):
    r,g,b=colorsys.hls_to_rgb(h/360,l/100,s/100)
    return '#%02X%02X%02X'%(round(r*255),round(g*255),round(b*255))
def hsl(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    mx,mn=max(r,g,b),min(r,g,b); l=(mx+mn)/2
    if mx==mn: return 0,0,round(l*100)
    d=mx-mn
    s=d/(2-mx-mn) if l>0.5 else d/(mx+mn)
    if mx==r: hh=(60*((g-b)/d))%360
    elif mx==g: hh=60*((b-r)/d)+120
    else: hh=60*((r-g)/d)+240
    return round(hh),round(s*100),round(l*100)

stops=[50,100,200,300,400,500,600,700,800,900]
targets={'primary':'#0F4C81','danger':'#E53E3E','warning':'#DD6B20','success':'#38A169'}
print("=== ESCALAS TONALES 50-900 (OKLCH-like via HSL, base = 500) ===")
out={}
for name,base in targets.items():
    h,s,l=hsl(base); row=[]
    for st in stops:
        # map 50->96% L ... 900->14% L; keep 500 = base
        if st<500:
            t=st/500.0; nl=l+(96-l)*t; ns=s*(0.75+0.25*t)
        elif st>500:
            t=(st-500)/400.0; nl=l-(l-14)*t; ns=s*(1-0.35*t)
        else:
            nl,ns=l,s
        row.append((st,tohex(h,ns,nl)))
    out[name]=row
    print(f"\n-- {name} (base {base}) --")
    for st,hx in row:
        print(f"  {st}: {hx}  white-text {cr(hx,'#FFFFFF')}:1  on-bg {cr(hx,'#F5F7FA')}:1")

print("\n=== CANDIDATOS: rojo/verde/naranja como TEXTO o con texto blanco ===")
cands={'danger-600':'#C53030','danger-700':'#9B2C2C','danger-dark':'#B83232','warning-700':'#9C4221',
 'warning-600':'#B45309','success-700':'#276749','success-600':'#2F855A','border-strong':'#CBD5E0',
 'border-strong2':'#B7C2D0','disabled-text':'#718096','focus':'#0F4C81'}
for k,v in cands.items():
    print(f"{k:16} {v}  white-on-it {cr(v,'#FFFFFF')}:1  on-white {cr(v,'#FFFFFF')}:1  on-bg {cr(v,'#F5F7FA')}:1")
print("\nnota: 'white-on-it' == 'on-white' (mismo par)")
print("\n=== PARES UTILES ===")
for a,b in [('#CBD5E0','#FFFFFF'),('#B7C2D0','#FFFFFF'),('#718096','#FFFFFF'),('#718096','#E2E8F0'),
            ('#9B2C2C','#FFF5F5'),('#9C4221','#FFFAF0'),('#276749','#F0FFF4'),
            ('#E53E3E','#FFFFFF'),('#C53030','#FFFFFF')]:
    print(f"{a} sobre {b}: {cr(a,b)}:1")
