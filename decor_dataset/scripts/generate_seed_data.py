import os, csv, random, json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
from datetime import datetime

random.seed(42)
np.random.seed(42)

for d in ["data/images","data/embeddings","models/v1","backend"]:
    os.makedirs(d, exist_ok=True)

CATEGORIES = [
    ("Mandap",    (210,165,55),  (180,130,30), 150000, 20),
    ("Stage",     (160, 40,50),  (130, 20,30), 100000, 20),
    ("Entrance",  (180,100,140), (150, 70,110), 45000, 15),
    ("Floral",    ( 50,150,70),  ( 30,120,50),  55000, 15),
    ("Reception", ( 80, 60,160), ( 50, 40,130),120000, 15),
    ("Table",     (140,100,60),  (110, 75,40),  35000, 15),
]
STYLES     = ["Traditional","Modern","Rustic","Royal","Minimalist","Floral Garden"]
COMPLEXITY = ["Low","Medium","High"]
COST_MULT  = {"Low":0.6,"Medium":1.0,"High":1.6}
FUNC_TYPES = ["Mandap","Stage","Entrance","Floral","Reception","Table"]

# ── 1. Generate images ────────────────────────────────────────
print("Step 1/3: Generating images...")
rows, counter = [], 1

for func_type, col1, col2, base_cost, count in CATEGORIES:
    for i in range(count):
        img = Image.new("RGB",(224,224),col1)
        draw = ImageDraw.Draw(img)
        for y in range(224):
            t = y/224
            r = int(col1[0]*(1-t)+col2[0]*t)
            g = int(col1[1]*(1-t)+col2[1]*t)
            b = int(col1[2]*(1-t)+col2[2]*t)
            draw.line([(0,y),(224,y)],fill=(r,g,b))
        for px_,py_ in [(30,60),(170,60),(30,180),(170,180)]:
            jx=px_+random.randint(-8,8); jy=py_+random.randint(-8,8)
            draw.rectangle([jx-7,jy-35,jx+7,jy+35],
                fill=(min(255,col1[0]+60),min(255,col1[1]+60),min(255,col1[2]+60)))
        draw.arc([30,20,194,100],0,180,
            fill=(min(255,col1[0]+80),min(255,col1[1]+80),min(255,col1[2]+80)),width=6)
        for _ in range(random.randint(30,80)):
            x=random.randint(10,214); y=random.randint(10,214); r2=random.randint(3,10)
            sh=random.randint(-40,40)
            draw.ellipse([x-r2,y-r2,x+r2,y+r2],
                fill=(max(0,min(255,col1[0]+sh+60)),max(0,min(255,col1[1]+sh+60)),max(0,min(255,col1[2]+sh+60))))
        for d in range(0,224,20):
            off=random.randint(-12,12)
            draw.line([(d+off,0),(d+off+20,224)],
                fill=(min(255,col2[0]+40),min(255,col2[1]+40),min(255,col2[2]+40)),width=2)
        for _ in range(random.randint(10,25)):
            x=random.randint(5,219); y=random.randint(5,219)
            draw.ellipse([x-3,y-3,x+3,y+3],fill=(255,255,200))
        img = img.filter(ImageFilter.GaussianBlur(0.8))
        px = img.load()
        for nx in range(224):
            for ny in range(224):
                r,g,b=px[nx,ny]; n=random.randint(-15,15)
                px[nx,ny]=(max(0,min(255,r+n)),max(0,min(255,g+n)),max(0,min(255,b+n)))
        fname=f"decor_{counter:03d}.jpg"
        img.save(f"data/images/{fname}","JPEG",quality=88)
        style=random.choice(STYLES); comp=random.choice(COMPLEXITY)
        cost=int(base_cost*COST_MULT[comp]*random.uniform(0.85,1.15))
        rows.append([fname,func_type,style,comp,cost])
        counter+=1
    print(f"  {func_type}: {count} images")

with open("data/labels.csv","w",newline="") as f:
    w=csv.writer(f); w.writerow(["filename","function_type","style","complexity","base_cost"]); w.writerows(rows)
print(f"  Total: {counter-1} images, labels.csv written\n")

# ── 2. Extract features ───────────────────────────────────────
print("Step 2/3: Extracting visual features...")

def extract_features(path):
    img=Image.open(path).convert("RGB").resize((224,224))
    arr=np.array(img,dtype=np.float32)/255.0
    feats=[]
    for c in range(3):
        hist,_=np.histogram(arr[:,:,c],bins=32,range=(0,1))
        feats.extend(hist/(hist.sum()+1e-8))
    for q in [arr[:112,:112],arr[:112,112:],arr[112:,:112],arr[112:,112:]]:
        for c in range(3):
            feats.append(float(q[:,:,c].mean())); feats.append(float(q[:,:,c].std()))
    gray=arr.mean(axis=2)
    feats+=[float(np.abs(np.diff(gray,axis=1)).mean()),float(np.abs(np.diff(gray,axis=0)).mean()),
            float(gray.mean()),float(gray.std())]
    feats+=[float(np.percentile(gray.flatten(),p)) for p in [25,50,75]]
    return np.array(feats,dtype=np.float32)

def one_hot(val,opts):
    v=np.zeros(len(opts)); 
    if val in opts: v[opts.index(val)]=1.0
    return v

X,y=[],[]
for row in rows:
    feats=extract_features(f"data/images/{row[0]}")
    np.save(f"data/embeddings/{row[0].replace('.jpg','.npy')}",feats)
    full=np.concatenate([feats,one_hot(row[1],FUNC_TYPES),one_hot(row[3],COMPLEXITY),one_hot(row[2],STYLES)])
    X.append(full); y.append(int(row[4]))

X,y=np.array(X),np.array(y)
print(f"  Features: {len(X)} samples × {X.shape[1]} dims\n")

# ── 3. Train ──────────────────────────────────────────────────
print("Step 3/3: Training RandomForest...")
X_tr,X_te,y_tr,y_te=train_test_split(X,y,test_size=0.2,random_state=42)
rf=RandomForestRegressor(n_estimators=200,min_samples_leaf=1,max_features="sqrt",n_jobs=-1,random_state=42)
rf.fit(X_tr,y_tr)
mae=mean_absolute_error(y_te,rf.predict(X_te))
print(f"  MAE: Rs.{mae:,.0f}")

joblib.dump(rf,"models/v1/cost_predictor.joblib")
json.dump({"version":"v1","mae":round(mae),"n_samples":len(X),"feature_dims":int(X.shape[1]),
           "func_types":FUNC_TYPES,"complexity":COMPLEXITY,"styles":STYLES,
           "trained_at":datetime.now().isoformat(),"extractor":"handcrafted_colour_edge_spatial"},
          open("models/v1/meta.json","w"),indent=2)

print("\n" + "="*50)
print("ALL DONE. Model ready.")
print("="*50)
print("Run next: python backend/app.py")
