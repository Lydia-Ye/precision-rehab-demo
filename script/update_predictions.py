#!/usr/bin/env python3
"""
Simple script to update prediction values in JSON files with percentage-based gradual increases.
Usage: python update_predictions.py <filename> <start_index> <max_percentage_increase>
Example: python update_predictions.py recommended_schedule_results_11.json 2 25.0
"""

import json
import sys
import os

def update_predictions_percentage(data, start_index, max_percentage_increase):
    """
    Update prediction values in the JSON data with a gradual percentage increase.
    
    Args:
        data: JSON data dictionary
        start_index: Index to start the increase (0-based)
        max_percentage_increase: Maximum percentage increase at the last value (e.g., 25.0 for 25%)
    """
    
    for iteration_key in data:
        if isinstance(data[iteration_key], dict):
            iteration = data[iteration_key]
            
            # Update maxPrediction, minPrediction, and meanPrediction
            for pred_key in ['maxPrediction', 'minPrediction', 'meanPrediction']:
                if pred_key in iteration and isinstance(iteration[pred_key], list):
                    pred_array = iteration[pred_key]
                    
                    if len(pred_array) > start_index:
                        # Calculate the number of elements to modify
                        num_elements_to_modify = len(pred_array) - start_index
                        
                        if num_elements_to_modify > 0:
                            # Apply gradual increase
                            for i in range(start_index, len(pred_array)):
                                # Calculate the position within the range (0 to 1)
                                position = (i - start_index) / (len(pred_array) - 1 - start_index) if len(pred_array) - 1 > start_index else 1.0
                                
                                # Calculate the percentage increase for this position
                                # Linear interpolation from 0% to max_percentage_increase
                                current_percentage = position * max_percentage_increase
                                
                                # Apply the percentage increase
                                original_value = pred_array[i]
                                increase_amount = original_value * (current_percentage / 100.0)
                                pred_array[i] = original_value + increase_amount
                                
                                print(f"  {pred_key}[{i}]: {original_value:.4f} -> {pred_array[i]:.4f} (+{current_percentage:.1f}%)")

def main():
    if len(sys.argv) < 4:
        print("Usage: python update_predictions.py <filename> <start_index> <max_percentage_increase>")
        print("Example: python update_predictions.py recommended_schedule_results_11.json 2 25.0")
        print("This will start increasing from index 2 with a gradual increase up to 25% at the last value")
        sys.exit(1)
    
    # append the path (../src/mock/prediction_results) to the filename
    filename = os.path.join(os.path.dirname(__file__), "..", "src", "mock", "prediction_results", sys.argv[1])
    
    try:
        start_index = int(sys.argv[2])
        if start_index < 0:
            print("Error: start_index must be non-negative")
            sys.exit(1)
    except ValueError:
        print("Error: start_index must be an integer")
        sys.exit(1)
    
    try:
        max_percentage_increase = float(sys.argv[3])
        if max_percentage_increase < 0:
            print("Error: max_percentage_increase must be non-negative")
            sys.exit(1)
    except ValueError:
        print("Error: max_percentage_increase must be a number")
        sys.exit(1)
    
    if not os.path.exists(filename):
        print(f"Error: File '{filename}' not found.")
        sys.exit(1)
    
    try:
        # Load JSON data
        with open(filename, 'r') as f:
            data = json.load(f)
        
        print(f"Loaded data from {filename}")
        print(f"Configuration:")
        print(f"  Start index: {start_index}")
        print(f"  Maximum percentage increase: {max_percentage_increase}%")
        print(f"  Pattern: Gradual increase from index {start_index} to {max_percentage_increase}% at the last value")
        print()
        
        # Apply the updates
        update_predictions_percentage(data, start_index, max_percentage_increase)
        
        # Save updated data
        with open(filename, 'w') as f:
            json.dump(data, f, indent=4)
        
        print(f"\nSuccessfully updated {filename}")
        print(f"Applied gradual percentage increase: starting at index {start_index}, up to {max_percentage_increase}% at the last value")
        
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON format in {filename}: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 