import json
import sys
from pathlib import Path

def set_model_params(patient_id, model_id, a, b, c, noise_scale, sig_slope, sig_offset, error_scale):
    file_path = Path(f"src/mock/prediction_results/{patient_id}/{model_id}.json")
    if not file_path.exists():
        print(f"File not found: {file_path}")
        return

    with open(file_path, "r") as f:
        data = json.load(f)

    for iter_key in data:
        if "last_param" in data[iter_key]:
            data[iter_key]["last_param"] = {
                "a": float(a),
                "b": float(b),
                "c": float(c),
                "noise_scale": float(noise_scale),
                "sig_slope": float(sig_slope),
                "sig_offset": float(sig_offset),
                "error_scale": float(error_scale)
            }

    with open(file_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"Updated last_param for all iterations in {file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 10:
        print("Usage: python set_model_param.py <patient_id> <model_id> <a> <b> <c> <noise_scale> <sig_slope> <sig_offset> <error_scale>")
        sys.exit(1)
    set_model_params(*sys.argv[1:]) 