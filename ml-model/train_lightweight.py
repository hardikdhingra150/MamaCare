import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, f1_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 90)
print("🚀 LIGHTWEIGHT ML TRAINING - Firebase Deployment Version")
print("=" * 90)

# ========================
# MATERNAL HEALTH - LIGHTWEIGHT
# ========================
print("\n" + "=" * 90)
print("🤰 MATERNAL HEALTH RISK - LIGHTWEIGHT MODEL")
print("=" * 90)

np.random.seed(42)
n = 2000

n1 = n // 3
n2 = n // 3
n3 = n - n1 - n2  # ensures n1 + n2 + n3 == n

age = np.concatenate([
    np.random.randint(18, 25, n1),
    np.random.randint(25, 35, n2),
    np.random.randint(35, 45, n3),
])
np.random.shuffle(age)


maternal_df = pd.DataFrame({
    'Age': age,
    'SystolicBP': np.random.normal(120, 25, n).clip(70, 200).astype(int),
    'DiastolicBP': np.random.normal(80, 18, n).clip(49, 130).astype(int),
    'BS': np.random.gamma(3, 2.5, n).clip(3.5, 18).round(1),
    'BodyTemp': np.random.normal(98.6, 1.8, n).clip(96, 103).round(1),
    'HeartRate': np.random.normal(80, 18, n).clip(45, 140).astype(int),
})

def calculate_risk(row):
    score = 0
    if row['Age'] < 20 or row['Age'] > 40: score += 4
    elif row['Age'] > 36: score += 2

    if row['SystolicBP'] >= 160 or row['DiastolicBP'] >= 100: score += 6
    elif row['SystolicBP'] >= 140 or row['DiastolicBP'] >= 90: score += 4
    elif row['SystolicBP'] >= 130 or row['DiastolicBP'] >= 85: score += 2

    if row['BS'] >= 12: score += 4
    elif row['BS'] >= 10: score += 2
    elif row['BS'] >= 8: score += 1

    if row['BodyTemp'] >= 100.5: score += 4
    elif row['BodyTemp'] >= 99.5: score += 2

    if row['HeartRate'] >= 110: score += 3
    elif row['HeartRate'] >= 100: score += 2
    elif row['HeartRate'] < 60: score += 2

    if score >= 10: return 'high risk'
    elif score >= 5: return 'mid risk'
    else: return 'low risk'

maternal_df['RiskLevel'] = maternal_df.apply(calculate_risk, axis=1)

print(f"📊 Dataset: {maternal_df.shape}")
print(maternal_df['RiskLevel'].value_counts())

# Encode
le_maternal = LabelEncoder()
maternal_df['RiskLevel_encoded'] = le_maternal.fit_transform(maternal_df['RiskLevel'])

# Features (original 6 only for smaller model)
feature_cols_m = ['Age', 'SystolicBP', 'DiastolicBP', 'BS', 'BodyTemp', 'HeartRate']
X_maternal = maternal_df[feature_cols_m]
y_maternal = maternal_df['RiskLevel_encoded']

# SMOTE
print("\n🔧 Applying SMOTE...")
smote = SMOTE(random_state=42)
X_maternal_balanced, y_maternal_balanced = smote.fit_resample(X_maternal, y_maternal)
print(f"✅ Balanced: {X_maternal_balanced.shape[0]} samples")

# Split
X_train_m, X_test_m, y_train_m, y_test_m = train_test_split(
    X_maternal_balanced, y_maternal_balanced,
    test_size=0.15,
    random_state=42,
    stratify=y_maternal_balanced
)

# Scale
scaler_maternal = StandardScaler()
X_train_m_scaled = scaler_maternal.fit_transform(X_train_m)
X_test_m_scaled = scaler_maternal.transform(X_test_m)

print(f"✅ Train: {X_train_m.shape[0]} | Test: {X_test_m.shape[0]}")

# Train LIGHTWEIGHT ensemble (only RF + XGB)
print("\n🚀 Training Lightweight Ensemble...")

print("1️⃣ Random Forest...")
rf_model = RandomForestClassifier(
    n_estimators=200,  # Reduced from 1000
    max_depth=20,      # Reduced from 40
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)
rf_model.fit(X_train_m_scaled, y_train_m)
rf_acc = rf_model.score(X_test_m_scaled, y_test_m)
print(f"   ✅ RF Accuracy: {rf_acc*100:.2f}%")

print("2️⃣ XGBoost...")
xgb_model = XGBClassifier(
    n_estimators=200,  # Reduced from 1000
    max_depth=10,      # Reduced from 18
    learning_rate=0.05,
    random_state=42,
    eval_metric='mlogloss'
)
xgb_model.fit(X_train_m_scaled, y_train_m)
xgb_acc = xgb_model.score(X_test_m_scaled, y_test_m)
print(f"   ✅ XGB Accuracy: {xgb_acc*100:.2f}%")

# Use best model
if xgb_acc > rf_acc:
    maternal_model = xgb_model
    print(f"\n🏆 Using XGBoost (better accuracy)")
else:
    maternal_model = rf_model
    print(f"\n🏆 Using Random Forest (better accuracy)")

# Evaluate
y_pred_m = maternal_model.predict(X_test_m_scaled)
test_acc_m = accuracy_score(y_test_m, y_pred_m)
f1_m = f1_score(y_test_m, y_pred_m, average='weighted')

print(f"\n{'='*90}")
print(f"🏆 MATERNAL HEALTH - LIGHTWEIGHT RESULTS")
print(f"{'='*90}")
print(f"✅ Test Accuracy: {test_acc_m*100:.2f}%")
print(f"✅ F1 Score: {f1_m*100:.2f}%")
print(f"\n📊 Classification Report:")
print(classification_report(y_test_m, y_pred_m, target_names=le_maternal.classes_))

# Save
joblib.dump(maternal_model, 'maternal_model_lite.pkl')
joblib.dump(scaler_maternal, 'maternal_scaler_lite.pkl')
joblib.dump(le_maternal, 'maternal_le_lite.pkl')
joblib.dump(feature_cols_m, 'maternal_features_lite.pkl')
print("\n💾 Saved lightweight maternal model!")

# ========================
# PCOS - LIGHTWEIGHT
# ========================
print("\n" + "=" * 90)
print("🩺 PCOS DETECTION - LIGHTWEIGHT MODEL")
print("=" * 90)

np.random.seed(42)
n = 1500

pcos_df = pd.DataFrame({
    'Age': np.random.randint(18, 45, n),
    'BMI': np.random.normal(27, 8, n).clip(18, 45),
    'Cycle_Length': np.where(
        np.random.rand(n) > 0.6,
        np.random.randint(36, 55, n),
        np.random.randint(24, 32, n)
    ),
    'LH': np.random.gamma(3, 3, n).clip(1, 30),
    'FSH': np.random.gamma(2, 2, n).clip(1, 20),
    'Testosterone': np.random.gamma(2.5, 15, n).clip(10, 90),
    'Waist_Hip_Ratio': np.random.normal(0.85, 0.12, n).clip(0.65, 1.1),
    'Insulin': np.random.gamma(3, 5, n).clip(5, 35),
})

pcos_df['LH_FSH_Ratio'] = pcos_df['LH'] / (pcos_df['FSH'] + 0.1)

def calculate_pcos(row):
    score = 0
    if row['LH_FSH_Ratio'] > 2.5: score += 5
    elif row['LH_FSH_Ratio'] > 2: score += 3

    if row['Cycle_Length'] > 35: score += 4
    elif row['Cycle_Length'] < 24: score += 2

    if row['BMI'] > 30: score += 3
    elif row['BMI'] > 27: score += 2

    if row['Testosterone'] > 50: score += 3

    if row['Waist_Hip_Ratio'] > 0.88: score += 2

    if row['Insulin'] > 20: score += 2

    return 1 if score >= 10 else 0

pcos_df['PCOS'] = pcos_df.apply(calculate_pcos, axis=1)

print(f"📊 PCOS Dataset: {pcos_df.shape}")
print(pcos_df['PCOS'].value_counts())

feature_cols_p = ['Age', 'BMI', 'Cycle_Length', 'LH', 'FSH', 'Testosterone', 
                  'Waist_Hip_Ratio', 'Insulin', 'LH_FSH_Ratio']
X_pcos = pcos_df[feature_cols_p]
y_pcos = pcos_df['PCOS']

# SMOTE
print("\n🔧 Applying SMOTE...")
smote_p = SMOTE(random_state=42)
X_pcos_balanced, y_pcos_balanced = smote_p.fit_resample(X_pcos, y_pcos)
print(f"✅ Balanced: {X_pcos_balanced.shape[0]} samples")

# Split
X_train_p, X_test_p, y_train_p, y_test_p = train_test_split(
    X_pcos_balanced, y_pcos_balanced,
    test_size=0.15,
    random_state=42,
    stratify=y_pcos_balanced
)

# Scale
scaler_pcos = StandardScaler()
X_train_p_scaled = scaler_pcos.fit_transform(X_train_p)
X_test_p_scaled = scaler_pcos.transform(X_test_p)

# Train
print("\n🚀 Training PCOS Lightweight Ensemble...")

print("1️⃣ Random Forest...")
rf_pcos = RandomForestClassifier(
    n_estimators=200,
    max_depth=20,
    random_state=42,
    n_jobs=-1,
    class_weight='balanced'
)
rf_pcos.fit(X_train_p_scaled, y_train_p)
rf_acc_p = rf_pcos.score(X_test_p_scaled, y_test_p)
print(f"   ✅ RF Accuracy: {rf_acc_p*100:.2f}%")

print("2️⃣ XGBoost...")
xgb_pcos = XGBClassifier(
    n_estimators=200,
    max_depth=10,
    learning_rate=0.05,
    random_state=42,
    eval_metric='logloss'
)
xgb_pcos.fit(X_train_p_scaled, y_train_p)
xgb_acc_p = xgb_pcos.score(X_test_p_scaled, y_test_p)
print(f"   ✅ XGB Accuracy: {xgb_acc_p*100:.2f}%")

# Use best
if xgb_acc_p > rf_acc_p:
    pcos_model = xgb_pcos
    print(f"\n🏆 Using XGBoost")
else:
    pcos_model = rf_pcos
    print(f"\n🏆 Using Random Forest")

# Evaluate
y_pred_p = pcos_model.predict(X_test_p_scaled)
test_acc_p = accuracy_score(y_test_p, y_pred_p)
f1_p = f1_score(y_test_p, y_pred_p)

print(f"\n{'='*90}")
print(f"🏆 PCOS - LIGHTWEIGHT RESULTS")
print(f"{'='*90}")
print(f"✅ Test Accuracy: {test_acc_p*100:.2f}%")
print(f"✅ F1 Score: {f1_p*100:.2f}%")
print(f"\n📊 Classification Report:")
print(classification_report(y_test_p, y_pred_p, target_names=['No PCOS', 'PCOS']))

# Save
joblib.dump(pcos_model, 'pcos_model_lite.pkl')
joblib.dump(scaler_pcos, 'pcos_scaler_lite.pkl')
joblib.dump(feature_cols_p, 'pcos_features_lite.pkl')
print("\n💾 Saved lightweight PCOS model!")

# ========================
# MODEL SIZE COMPARISON
# ========================
import os

print("\n" + "=" * 90)
print("📦 MODEL SIZE COMPARISON")
print("=" * 90)

maternal_size = os.path.getsize('maternal_model_lite.pkl') / (1024*1024)
pcos_size = os.path.getsize('pcos_model_lite.pkl') / (1024*1024)
total_size = maternal_size + pcos_size

print(f"\n🤰 Maternal Model: {maternal_size:.2f} MB")
print(f"🩺 PCOS Model: {pcos_size:.2f} MB")
print(f"📊 Total Size: {total_size:.2f} MB")

if total_size < 50:
    print(f"\n✅ Models are Firebase-ready! (Under 50MB)")
else:
    print(f"\n⚠️ Total size: {total_size:.2f} MB - May need optimization")

print("\n" + "=" * 90)
print("🎯 LIGHTWEIGHT MODELS READY FOR FIREBASE DEPLOYMENT!")
print("=" * 90)
print(f"\nMaternal: {test_acc_m*100:.2f}% accuracy")
print(f"PCOS: {test_acc_p*100:.2f}% accuracy")
print("=" * 90)