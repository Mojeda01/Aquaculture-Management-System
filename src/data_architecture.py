import numpy as np
import pandas as pd


class Data_Architecture:
    def __init__(self):

        self.site_schema = {
            "site_id": "int",
            "latitude": "float",
            "longitude": "float",
            "water_depth_m": "float",
            "distance_from_shore_km": "float",
            "avg_current_speed_m_s": "float",
            "water_temp_c": "float",
            "salinity_psu": "float",
            "wave_exposure_index": "float",
            "regulatory_zone": "category"
        }

        self.cage_schema = {
            "cage_id": "int",
            "site_id": "int",
            "cage_volume_m3": "float",
            "stocking_density_kg_m3": "float",
            "net_mesh_size_mm": "float",
            "fouling_index": "float",
            "oxygen_flow_l_min": "float",
            "maintenance_cycle_days": "int"
        }

        self.cohort_schema = {
            "cohort_id": "int",
            "cage_id": "int",
            "species": "category",
            "initial_weight_g": "float",
            "current_weight_g": "float",
            "age_days": "int",
            "survival_rate_pct": "float",
            "feed_conversion_ratio": "float",
            "growth_rate_g_day": "float",
            "disease_status": "category"
        }

        self.water_quality_schema = {
            "site_id": "int",
            "dissolved_oxygen_mg_l": "float",
            "ammonia_mg_l": "float",
            "nitrate_mg_l": "float",
            "turbidity_ntu": "float",
            "chlorophyll_index": "float"
        }

        self.operations_schema = {
            "site_id": "int",
            "labor_hours_day": "float",
            "energy_kwh_day": "float",
            "maintenance_events_month": "int",
            "treatment_events": "int",
            "mortality_events": "int"
        }

        self.financial_schema = {
            "site_id": "int",
            "harvest_weight_kg": "float",
            "market_price_per_kg": "float",
            "revenue": "float",
            "cost": "float",
            "profit_margin": "float"
        }

    def summary(self):
        return {
            "sites": self.site_schema,
            "cages": self.cage_schema,
            "cohorts": self.cohort_schema,
            "water_quality": self.water_quality_schema,
            "operations": self.operations_schema,
            "financials": self.financial_schema
        }

    def construct(self, n_samples=500, random_seed=42):
        np.random.seed(random_seed)

        all_schemas = {}
        for schema in [
            self.site_schema,
            self.cage_schema,
            self.cohort_schema,
            self.water_quality_schema,
            self.operations_schema,
            self.financial_schema,
        ]:
            all_schemas.update(schema)

        data = {}

        for var, vtype in all_schemas.items():

            if vtype == "int":
                base = np.linspace(1, 1000, n_samples)
                noise = np.random.normal(0, 50, n_samples)
                data[var] = np.clip((base + noise).astype(int), 1, None)

            elif vtype == "float":
                base = np.linspace(0, 1, n_samples)
                noise = np.random.normal(0, 0.2, n_samples)
                data[var] = base + noise

            elif vtype == "category":
                categories = ["A", "B", "C"]
                data[var] = np.random.choice(categories, size=n_samples)

            else:
                data[var] = [None] * n_samples

        return pd.DataFrame(data)

    def data(self,
             n_samples = 500,
             filepath="synthetic_aquaculture.json",
             orient="records",
             random_seed=42):

        df = self.construct(n_samples=n_samples, random_seed=random_seed)
        df.to_json(
            filepath,
            orient=orient,
            indent=2
        )
        return filepath

x = Data_Architecture()

json_path = x.data(
    n_samples=500,
    filepath="aquaculture_dataset.json"
)

print("Saved to:", json_path)
