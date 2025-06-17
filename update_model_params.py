import json
import os
import random
from pathlib import Path

def generate_similar_params(base_params, max_diff=0.05):
    """Generate new parameters that are similar to the base parameters."""
    new_params = base_params.copy()
    for key in ['a', 'b', 'c']:
        if key in new_params:
            # Generate a random change between -max_diff and +max_diff
            change = random.uniform(-max_diff, max_diff)
            new_params[key] = round(base_params[key] + change, 3)
    return new_params

def update_prediction_results(patient_dir):
    """Update model parameters in prediction results files for a patient."""
    # Process both recommended and manual schedule results
    for schedule_type in ['recommended', 'manual']:
        file_path = patient_dir / f'{schedule_type}_schedule_results_{patient_dir.name}.json'
        
        if not file_path.exists():
            print(f"File not found: {file_path}")
            continue
            
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            
            # Check if the file has iterations
            if any(key.startswith('iter_') for key in data.keys()):
                # Process each iteration
                base_params = None
                for iter_key in sorted(data.keys()):
                    if not iter_key.startswith('iter_'):
                        continue
                        
                    if base_params is None:
                        # Use the first iteration's parameters as base
                        base_params = data[iter_key]['last_param']
                    else:
                        # Generate new parameters based on the base parameters
                        data[iter_key]['last_param'] = generate_similar_params(base_params)
                
                # Write back the updated data
                with open(file_path, 'w') as f:
                    json.dump(data, f, indent=2)
                print(f"Updated parameters in {file_path}")
            else:
                # If no iterations, create iterations with slightly different parameters
                base_params = data['last_param']
                new_data = {}
                
                # Create 5 iterations with slightly different parameters
                for i in range(1, 6):
                    iter_key = f'iter_{i}'
                    new_data[iter_key] = data.copy()
                    new_data[iter_key]['last_param'] = generate_similar_params(base_params)
                
                # Write back the updated data
                with open(file_path, 'w') as f:
                    json.dump(new_data, f, indent=2)
                print(f"Created iterations with updated parameters in {file_path}")
                
        except Exception as e:
            print(f"Error processing {file_path}: {str(e)}")

def main():
    # Path to the prediction results directory
    base_dir = Path('src/mock/prediction_results')
    
    if not base_dir.exists():
        print(f"Directory not found: {base_dir}")
        return
        
    # Process each patient directory
    for patient_dir in base_dir.iterdir():
        if patient_dir.is_dir():
            print(f"\nProcessing patient: {patient_dir.name}")
            update_prediction_results(patient_dir)

if __name__ == "__main__":
    main() 