import sys
import os
import json

# ── Use bundled packages ─────────────────────────────────────
script_dir   = os.path.dirname(os.path.abspath(__file__))
packages_dir = os.path.join(script_dir, 'packages')

if packages_dir not in sys.path:
    sys.path.insert(0, packages_dir)

# ── Now safe to import ───────────────────────────────────────
import joblib
import numpy as np


def predict_maternal_risk(age, systolic, diastolic, bs, temp, hr):
    try:
        model  = joblib.load(os.path.join(script_dir, 'maternal_model_lite.pkl'))
        scaler = joblib.load(os.path.join(script_dir, 'maternal_scaler_lite.pkl'))
        le     = joblib.load(os.path.join(script_dir, 'maternal_le_lite.pkl'))

        features        = np.array([[age, systolic, diastolic, bs, temp, hr]])
        features_scaled = scaler.transform(features)

        prediction    = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        risk_level    = le.inverse_transform([prediction])[0]
        confidence    = max(probabilities)

        risk_map = {
            'high risk':     'HIGH',
            'mid risk':      'MODERATE',
            'moderate risk': 'MODERATE',
            'low risk':      'LOW',
            'high':          'HIGH',
            'moderate':      'MODERATE',
            'low':           'LOW',
        }
        normalized_risk = risk_map.get(risk_level.lower().strip(), 'MODERATE')

        return {
            'success':       True,
            'risk':          normalized_risk,
            'riskLevel':     risk_level,
            'confidence':    round(confidence, 4),
            'probabilities': {
                le.classes_[i]: round(float(prob), 4)
                for i, prob in enumerate(probabilities)
            }
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


def predict_pcos(features_dict):
    try:
        model         = joblib.load(os.path.join(script_dir, 'pcos_model_lite.pkl'))
        scaler        = joblib.load(os.path.join(script_dir, 'pcos_scaler_lite.pkl'))
        feature_names = joblib.load(os.path.join(script_dir, 'pcos_features_lite.pkl'))

        features        = np.array([[features_dict.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)

        prediction  = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        has_pcos    = bool(prediction)
        confidence  = max(probability)

        return {
            'success':     True,
            'risk':        'HIGH' if has_pcos else 'LOW',
            'hasPCOS':     has_pcos,
            'confidence':  round(confidence, 4),
            'probability': round(float(probability[1]), 4)
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


if __name__ == '__main__':
    model_type = sys.argv[1]

    if model_type == 'maternal':
        result = predict_maternal_risk(
            float(sys.argv[2]),
            float(sys.argv[3]),
            float(sys.argv[4]),
            float(sys.argv[5]),
            float(sys.argv[6]),
            float(sys.argv[7]),
        )
    elif model_type == 'pcos':
        result = predict_pcos(json.loads(sys.argv[2]))
    else:
        result = {'success': False, 'error': 'Invalid model type'}

    print(json.dumps(result))
