from pathlib import Path
import numpy as np
import pandas as pd
import statsmodels.api as sm

# build a path relative to your project root
BASE_DIR = Path(__file__).resolve().parents[2]
data_path = BASE_DIR / "aquaculture_dataset.json"
results_path = BASE_DIR / "data" / "ols_results.json"
results_path_GLSAR = BASE_DIR / "data" / "glsar_results.json"
results_path_BI = BASE_DIR / "data" / "bi_results.json"

class StatsStructure:
    def __init__(self):
        pass

    # Regression - OLS,WLS,GLS,GLSAR,RecursiveLS,RollingOLS,RollingWLS
    def OLS(self, target="harvest_weight_kg"):
        # OLS resource
        # https://www.statsmodels.org/stable/generated/statsmodels.regression.linear_model.OLS.html#statsmodels.regression.linear_model.OLS
        if not data_path.exists():
            raise FileNotFoundError(f"Dataset not found at: {data_path}")
        df = pd.read_json(data_path, orient="records")
        X = df.select_dtypes(include=[np.number]).copy()
        y = X.pop(target)
        X = sm.add_constant(X)
        model = sm.OLS(y, X, missing="drop")
        results = model.fit()

        ols_json = {
            "r_squared": float(results.rsquared),
            "adj_r_squared": float(results.rsquared_adj),
            "f_statistic": float(results.fvalue),
            "f_pvalue": float(results.f_pvalue),
            "aic": float(results.aic),
            "bic": float(results.bic),
            "n_observations": int(results.nobs),
            "condition_number": float(results.condition_number),
            "coefficients": results.params.to_dict(),
            "p_values": results.pvalues.to_dict()
        }
        
        fitted = results.fittedvalues
        actual = y.loc[fitted.index]

        ols_json["observations"] = [
                {"fitted": float(f), "actual": float(a)}
                for f, a in zip(fitted, actual)
        ]
        results_path.parent.mkdir(exist_ok=True)
        pd.Series(ols_json).to_json(results_path, indent=2)

        return results

    def GLSAR(self, target="harvest_weight_kg", ar_order=1):
        # Weighted Least Squares
        if not data_path.exists():
            raise FileNotFoundError(f"Dataset not found at: {data_path}")
        df = pd.read_json(data_path, orient="records")

        X = df.select_dtypes(include=[np.number]).copy()
        y = X.pop(target)
        X = sm.add_constant(X)

        # fit GLSAR with AR errors
        model = sm.GLSAR(y, X, rho=ar_order)
        results = model.iterative_fit()
        fitted = results.fittedvalues
        actual = y.loc[fitted.index]

        glsar_json = {
            "model_metrics": {
                "ar_order": int(ar_order),
                "rsquared": float(results.rsquared),
                "aic": float(results.aic),
                "bic": float(results.bic),
                "n_observations": int(results.nobs)
            },
            "coefficients": results.params.to_dict(),
            "observations": [
                {"fitted": float(f), "actual": float(a)}
                for f, a in zip(fitted, actual)
            ]
        }
        results_path_GLSAR.parent.mkdir(exist_ok=True)
        pd.Series(glsar_json).to_json(results_path_GLSAR, indent=2)
        return results


