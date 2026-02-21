import sys
import json
import joblib
import numpy as np
import os

script_dir = os.path.dirname(os.path.abspath(__file__))

def predict_maternal_risk(age, systolic, diastolic, bs, temp, hr):
    """Predict maternal health risk - LITE version"""
    try:
        model = joblib.load(os.path.join(script_dir, 'maternal_model_lite.pkl'))
        scaler = joblib.load(os.path.join(script_dir, 'maternal_scaler_lite.pkl'))
        le = joblib.load(os.path.join(script_dir, 'maternal_le_lite.pkl'))
        
        # Simple 6 features (no engineering for lite version)
        features = np.array([[age, systolic, diastolic, bs, temp, hr]])
        features_scaled = scaler.transform(features)
        
        prediction = model.predict(features_scaled)[0]
        probabilities = model.predict_proba(features_scaled)[0]
        
        risk_level = le.inverse_transform([prediction])[0]
        confidence = max(probabilities) * 100
        
        return {
            'success': True,
            'riskLevel': risk_level,
            'confidence': round(confidence, 2),
            'probabilities': {
                le.classes_[i]: round(prob * 100, 2) 
                for i, prob in enumerate(probabilities)
            }
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}

def predict_pcos(features_dict):
    """Predict PCOS - LITE version"""
    try:
        model = joblib.load(os.path.join(script_dir, 'pcos_model_lite.pkl'))
        scaler = joblib.load(os.path.join(script_dir, 'pcos_scaler_lite.pkl'))
        feature_names = joblib.load(os.path.join(script_dir, 'pcos_features_lite.pkl'))  # Fixed: was missing
        
        features = np.array([[features_dict.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)
        
        prediction = model.predict(features_scaled)[0]
        probability = model.predict_proba(features_scaled)[0]
        
        has_pcos = bool(prediction)
        confidence = max(probability) * 100
        
        return {
            'success': True,
            'hasPCOS': has_pcos,
            'confidence': round(confidence, 2),
            'probability': round(probability[1] * 100, 2)
        }
    except Exception as e:
        return {'success': False, 'error': str(e)}


if __name__ == '__main__':
    model_type = sys.argv[1]
    
    if model_type == 'maternal':
        age = float(sys.argv[2])
        systolic = float(sys.argv[3])
        diastolic = float(sys.argv[4])
        bs = float(sys.argv[5])
        temp = float(sys.argv[6])
        hr = float(sys.argv[7])
        result = predict_maternal_risk(age, systolic, diastolic, bs, temp, hr)
    
    elif model_type == 'pcos':
        features_json = sys.argv[2]
        features = json.loads(features_json)
        result = predict_pcos(features)
    
    else:
        result = {'success': False, 'error': 'Invalid model type'}
    
    print(json.dumps(result))
