import functions_framework
import joblib
import numpy as np
import json
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

@functions_framework.http
def predictMaternalRisk(request):
    if request.method == 'OPTIONS':
        return ('', 204, cors_headers())

    try:
        data   = request.get_json()
        model  = joblib.load(os.path.join(BASE_DIR, 'maternal_model_lite.pkl'))
        scaler = joblib.load(os.path.join(BASE_DIR, 'maternal_scaler_lite.pkl'))
        le     = joblib.load(os.path.join(BASE_DIR, 'maternal_le_lite.pkl'))

        features = np.array([[
            data['age'], data['systolicBP'], data['diastolicBP'],
            data['bloodSugar'], data['bodyTemp'], data['heartRate']
        ]])

        scaled     = scaler.transform(features)
        prediction = model.predict(scaled)[0]
        probs      = model.predict_proba(scaled)[0]
        risk_level = le.inverse_transform([prediction])[0]

        result = {
            'success': True,
            'riskLevel': risk_level,
            'confidence': round(float(max(probs)) * 100, 2),
            'probabilities': {
                le.classes_[i]: round(float(p) * 100, 2)
                for i, p in enumerate(probs)
            }
        }
    except Exception as e:
        result = {'success': False, 'error': str(e)}

    return (json.dumps(result), 200, cors_headers())


@functions_framework.http
def predictPCOS(request):
    if request.method == 'OPTIONS':
        return ('', 204, cors_headers())

    try:
        data          = request.get_json()
        model         = joblib.load(os.path.join(BASE_DIR, 'pcos_model_lite.pkl'))
        scaler        = joblib.load(os.path.join(BASE_DIR, 'pcos_scaler_lite.pkl'))
        feature_names = joblib.load(os.path.join(BASE_DIR, 'pcos_features_lite.pkl'))

        features = np.array([[data.get(f, 0) for f in feature_names]])
        scaled   = scaler.transform(features)

        prediction  = model.predict(scaled)[0]
        probability = model.predict_proba(scaled)[0]

        result = {
            'success': True,
            'hasPCOS': bool(prediction),
            'confidence': round(float(max(probability)) * 100, 2),
            'probability': round(float(probability[1]) * 100, 2)
        }
    except Exception as e:
        result = {'success': False, 'error': str(e)}

    return (json.dumps(result), 200, cors_headers())
