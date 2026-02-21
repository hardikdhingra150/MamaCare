
import sys
import json
import joblib
import numpy as np
import os

# Get script directory
script_dir = os.path.dirname(os.path.abspath(__file__))

def predict_maternal_risk(age, systolic, diastolic, bs, temp, hr):
    """Predict maternal health risk"""
    try:
        # Load models
        model = joblib.load(os.path.join(script_dir, 'maternal_risk_model.pkl'))
        scaler = joblib.load(os.path.join(script_dir, 'maternal_scaler.pkl'))
        le = joblib.load(os.path.join(script_dir, 'maternal_label_encoder.pkl'))
        features_list = joblib.load(os.path.join(script_dir, 'maternal_features.pkl'))
        
        # Prepare base features
        base_features = {
            'Age': age,
            'SystolicBP': systolic,
            'DiastolicBP': diastolic,
            'BS': bs,
            'BodyTemp': temp,
            'HeartRate': hr
        }
        
        # Add engineered features (same as training)
        base_features['BP_Mean'] = (systolic + diastolic) / 2
        base_features['BP_Pulse_Pressure'] = systolic - diastolic
        base_features['BP_Product'] = systolic * diastolic
        base_features['BP_Ratio'] = systolic / diastolic
        base_features['Age_Squared'] = age ** 2
        base_features['Age_BP_Interaction'] = (age * systolic) / 100
        base_features['Age_BS_Interaction'] = age * bs
        base_features['BS_Temp_Product'] = bs * temp
        base_features['HR_Temp_Ratio'] = hr / temp
        base_features['Risk_Index'] = (
            (systolic / 120) * 0.3 +
            (bs / 7) * 0.3 +
            (hr / 80) * 0.2 +
            (temp / 98.6) * 0.2
        )
        
        # Create feature array in correct order
        feature_array = np.array([[base_features[f] for f in features_list]])
        
        # Scale and predict
        features_scaled = scaler.transform(feature_array)
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
    """Predict PCOS"""
    try:
        model = joblib.load(os.path.join(script_dir, 'pcos_detection_model.pkl'))
        scaler = joblib.load(os.path.join(script_dir, 'pcos_scaler.pkl'))
        feature_names = joblib.load(os.path.join(script_dir, 'pcos_features.pkl'))
        
        # Prepare features in correct order
        features = np.array([[features_dict.get(f, 0) for f in feature_names]])
        features_scaled = scaler.transform(features)
        
        # Predict
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
    # Get command line arguments
    model_type = sys.argv[1]  # 'maternal' or 'pcos'
    
    if model_type == 'maternal':
        age = float(sys.argv[2])
        systolic = float(sys.argv[3])
        diastolic = float(sys.argv[4])
        bs = float(sys.argv[5])
        temp = float(sys.argv[6])
        hr = float(sys.argv[7])
        
        result = predict_maternal_risk(age, systolic, diastolic, bs, temp, hr)
    
    elif model_type == 'pcos':
        # Parse JSON features
        features_json = sys.argv[2]
        features = json.loads(features_json)
        result = predict_pcos(features)
    
    else:
        result = {'success': False, 'error': 'Invalid model type'}
    
    print(json.dumps(result))
