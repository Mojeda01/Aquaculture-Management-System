import numpy as np
import pandas as pd
import json 
from scipy import stats
from scipy.optimize import curve_fit, minimize
from scipy.interpolate import interp1d
from scipy.signal import find_peaks
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster
from scipy.spatial.distance import pdist
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class AquacultureStatisticalAnalysis:
    def __init__(self, data_path: str):
        with open(data_path, 'r') as f:
            self.data = json.load(f)
        self.df = pd.DataFrame(self.data)


    def _convert_to_json_serializable(self, obj):
        if isinstance(obj, dict):
            return {k: self._convert_to_json_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_json_serializable(item) for item in obj]
        elif isinstance(obj, (np.integer, np.floating)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, (np.bool_, bool)):
            return bool(obj)
        else:
            return obj

    # Hypothesis testing 
    def compare_species_performance(self) -> Dict:
        species_groups = self.df.groupby('species')['profit_margin'].apply(list)
        f_stat, p_anova = stats.f_oneway(*species_groups.values)
        h_stat, p_kruskal = stats.kruskal(*species_groups.values)
        species_list = list(species_groups.index)
        pairwise_results = []

        for i in range(len(species_list)):
            for j in range(i+1, len(species_list)):
                sp1, sp2 = species_list[i], species_list[j]
                u_stat, p_val = stats.mannwhitneyu(
                    species_groups[sp1],
                    species_groups[sp2],
                    alternative='two-sided'
                )

                pairwise_results.append({
                    'species_1': sp1,
                    'species_2': sp2,
                    'u_statistic': float(u_stat),
                    'p_value': float(p_val),
                    'significant': bool(p_val < 0.05),
                    'median_diff': float(np.median(species_groups[sp1]) - np.median(species_groups[sp2]))
                })
        
        # effect size 
        grand_mean = self.df['profit_margin'].mean()
        ss_between = sum(len(group) * (np.mean(group) - grand_mean)**2
                         for group in species_groups.values)
        ss_total = sum((self.df['profit_margin'] - grand_mean)**2)
        eta_squared = ss_between / ss_total

        return {
            'anova' : {
                'f_statistic': float(f_stat),
                'p_value': float(p_anova),
                'significant': p_anova < 0.05,
                'interpretation': 'Significant differences exist' if p_anova < 0.05 else 'No significant differences'
            },
            'kruskal_wallis': {
                'h_statistic': float(h_stat),
                'p_value': float(p_kruskal),
                'significant': p_kruskal < 0.05
            },
            'effect_size': {
                'eta_squared': float(eta_squared),
                'magnitude': 'Large' if eta_squared > 0.14 else ('Medium' if eta_squared > 0.06 else 'Small')
            },
            'pairwise_comparisons': pairwise_results,
            'species_stats': {
                sp: {
                    'mean': float(np.mean(vals)),
                    'median': float(np.median(vals)),
                    'std': float(np.std(vals)),
                    'n': len(vals)
                }
                for sp, vals in species_groups.items()
            }
        }
    
    # Correlation analysis - discover relationships
    def comprehensive_correlation_analysis(self) -> Dict:
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        key_vars =  ['water_temp_c', 'dissolved_oxygen_mg_l', 'stocking_density_kg_m3',
                     'feed_conversion_ratio', 'survival_rate_pct', 'profit_margin']
        correlations = {}

        for var1 in key_vars:
            for var2 in key_vars:
                if var1 >= var2: # Avoid duplicates
                    continue 

                # Remove NaN values 
                mask = ~(self.df[var1].isna() | self.df[var2].isna())
                x = self.df.loc[mask, var1]
                y = self.df.loc[mask, var2]

                pearson_r, pearson_p = stats.pearsonr(x, y)
                spearman_r, spearman_p = stats.spearmanr(x, y)
                kendall_tau, kendall_p = stats.kendalltau(x, y)

                correlations[f"{var1}_vs_{var2}"] = {
                    'pearson': {
                        'correlation': float(pearson_r),
                        'p_value': float(pearson_p),
                        'significant': pearson_p < 0.05
                    },
                    'spearman': {
                        'correlation': float(spearman_r),
                        'p_value': float(spearman_p),
                        'significant': spearman_p < 0.05
                    },
                    'kendall': {
                        'correlation': float(kendall_tau),
                        'p_value': float(kendall_p),
                        'significant': kendall_p < 0.05
                    },
                    'strength': self._correlation_strength(abs(pearson_r))
                }
        # fnd strongest correlation
        strong_correlations = [
            {
                'pair': pair,
                'pearson_r': data['pearson']['correlation'],
                'p_value': data['pearson']['p_value']  
            }
            for pair, data in correlations.items()
            if abs(data['pearson']['correlation']) > 0.5 and data['pearson']['significant']    
        ]

        return {
            'detailed_correlations': correlations,
            'strong_correlations': sorted(strong_correlations, 
                                          key=lambda x: abs(x['pearson_r']), 
                                          reverse=True)[:10]
        }
    
    def _correlation_strength(self, r: float) -> str:
         if r >= 0.7:
             return "Very Strong"
         elif r >= 0.5:
             return "Strong"
         elif r >= 0.3:
             return "Moderate"
         elif r >= 0.1:
             return "Weak"
         else:
             return "Very weak"
         
    # Distribution analysis
    def analyze_distributions(self) -> Dict:
        key_vars = ['profit_margin', 'survival_rate_pct', 'growth_rate_g_day',
                    'feed_conversion_ratio']
        distribution_results = {}
        for var in key_vars:
            data = self.df[var].dropna()

            # Normality tests
            shapiro_stat, shapiro_p = stats.shapiro(data[:5000])
            anderson_result = stats.anderson(data)
            skewness = stats.skew(data)
            kurtosis = stats.kurtosis(data)
            fits = {}

            mu_norm, std_norm = stats.norm.fit(data)
            ks_stat_norm, ks_p_norm = stats.kstest(data, 'norm', args=(mu_norm, std_norm))
            fits['normal'] = {
                'params': {'mu': float(mu_norm), 'sigma': float(std_norm)},
                'ks_statistic': float(ks_stat_norm),
                'p_value': float(ks_p_norm),
                'good_fit': ks_p_norm > 0.05
            }
            # Lognormal distribution (if all positive)
            if (data > 0).all():
                shape_log, loc_log, scale_log = stats.lognorm.fit(data)
                ks_stat_log, ks_p_log = stats.kstest(data, 'lognorm',
                                                 args=(shape_log, loc_log, scale_log))
                
                fits['lognormal'] = {
                    'params': {'shape': float(shape_log), 'loc': float(loc_log),
                               'scale': float(scale_log)},
                    'ks_statistic': float(ks_stat_log),
                    'p_value': float(ks_p_log),
                    'good_fit': ks_p_log > 0.05
                }
            
            # Gamma distribution (if all positive)
            if (data > 0).all():
                alpha_gamma, loc_gamma, beta_gamma = stats.gamma.fit(data)
                ks_stat_gamma, ks_p_gamma = stats.kstest(data, 'gamma',
                            args=(alpha_gamma, loc_gamma, beta_gamma))
                
                fits['gamma'] = {
                    'params': {'alpha': float(alpha_gamma), 'loc': float(loc_gamma),
                               'beta': float(beta_gamma)},
                    'ks_statistic': float(ks_stat_gamma),
                    'p_value': float(ks_p_gamma),
                    'good_fit': ks_p_gamma > 0.05
                }

            best_fit = max(fits.items(), key=lambda x: x[1]['p_value'])

            distribution_results[var] = {
                'normality_tests': {
                    'shapiro_wilk': {
                        'statistic': float(shapiro_stat),
                        'p_value': float(shapiro_p),
                        'is_normal': shapiro_p > 0.05
                    },
                    'anderson_darling': {
                        'statistic': float(anderson_result.statistic),
                        'critical_values': anderson_result.critical_values.tolist(),
                        'significance_levels': anderson_result.significance_level.tolist()
                    }
                },
                'shape': {
                    'skewness': float(skewness),
                    'kurtosis': float(kurtosis),
                    'interpretation': {
                        'skewness': 'Right-skewed' if skewness > 0.5 else (
                            'Left-skewed' if skewness < -0.5 else 'Approximately symmetric'
                        ),
                        'kurtosis': 'Heavy-tailed' if kurtosis > 1 else (
                            'Light-tailed' if kurtosis < -1 else 'Normal-tailed'
                        )
                    }
                },
                'distribution_fits': fits,
                'best_fit': {
                    'distribution': best_fit[0],
                    'params': best_fit[1]['params'],
                    'p_value': best_fit[1]['p_value']
                }
            }
        return distribution_results
    
    # growth curve fittiing - optimize harvest timing 
    def fit_growth_curves(self) -> Dict:
        growth_curves = {}
        for species in self.df['species'].unique():
            species_data = self.df[self.df['species'] == species].sort_values('age_days')
            age = species_data['age_days'].values 
            weight = species_data["current_weight_g"].values

            # Von Bertalanffy growth model: W(t) = W_inf * (1 - exp(-k*(t - t0)))^3
            def von_bertalanffy(t, W_inf, k, t0):
                return W_inf * (1 - np.exp(-k * (t - t0)))**3
            
            # logistic growth model: W(t) = W_inf / (1 + exp(-k*(t - t0)))
            def logistic(t, W_inf, k, t0):
                return W_inf / (1 + np.exp(-k * (t - t0)))
            
            # Gompertz growth model: W(t) = W_inf * exp(-exp(-k*(t - t0)))
            def gompertz(t, W_inf, k, t0):
                return W_inf * np.exp(-np.exp(-k * (t - t0)))
            
            models = {}

            try:
                popt_vb, pcov_vb = curve_fit(von_bertalanffy, age, weight, 
                                             p0=[np.max(weight)*1.2, 0.01, 0],
                                             maxfev=10000)
                predicted_vb = von_bertalanffy(age, *popt_vb)
                r2_vb = 1 - (np.sum((weight - predicted_vb)**2) / 
                             np.sum((weight - np.mean(weight))**2))
                
                models['von_bertalanffy'] = {
                    'params': {'W_inf': float(popt_vb[0]), 
                            'k': float(popt_vb[1]), 
                            't0': float(popt_vb[2])},
                    'r_squared': float(r2_vb),
                    'rmse': float(np.sqrt(np.mean((weight - predicted_vb)**2)))
                }
            except:
                models['von_bertalanffy'] = {'error': 'Fit failed'} 

            # Fit Logistic
            try:
                popt_log, pcov_log = curve_fit(logistic, age, weight,
                                               p0=[np.max(weight)*1.2, 0.05, np.median(age)],
                                               maxfev=10000)
                predicted_log = logistic(age, *popt_log)
                r2_log = 1 - (np.sum((weight - predicted_log)**2) /
                              np.sum((weight - np.mean(weight))**2))
                models['logistic'] = {
                    'params': {'W_inf': float(popt_log[0]),
                               'k': float(popt_log[1]),
                               't0': float(popt_log[2])},
                    'r_squared' : float(r2_log),
                    'rmse': float(np.sqrt(np.mean((weight - predicted_log)**2)))
                }
            except:
                models['logistic'] = {'error' : 'Fit failed'}

            # fit Gompertz
            try:
                popt_gomp, pcov_gomp = curve_fit(gompertz, age, weight,
                                                 p0=[np.max(weight)*1.2, 0.05, np.median(age)],
                                                 maxfev=10000)
                predicted_gomp = gompertz(age, *popt_gomp)
                r2_gomp = 1 - (np.sum((weight - predicted_gomp)**2) / 
                               np.sum((weight - np.mean(weight))**2))
                
                models['gompertz'] = {
                    'params': {'W_inf': float(popt_gomp[0]),
                               'k': float(popt_gomp[1]),
                               't0': float(popt_gomp[2])},
                    'r_squared': float(r2_gomp),
                    'rmse': float(np.sqrt(np.mean((weight - predicted_gomp)**2)))
                }
            except:
                models['gompertz'] = {'error': 'Fit failed'}

            # best model 
            valid_models = {k: v for k, v in models.items() if 'error' not in v}
            if valid_models:
                best_model = max(valid_models.items(), key=lambda x: x[1]['r_squared'])
                growth_curves[species] = {
                    'models': models,
                    'best_model': best_model[0],
                    'best_r_squared': best_model[1]['r_squared']
                }
            else:
                growth_curves[species] = {'models': models, 'error': 'All fits failed'}
        return growth_curves
    
    # Optimization - find optimal operating conditions 

    def optimize_stocking_density(self) -> Dict:
        density_profit_data = self.df[['stocking_density_kg_m3', 'profit_margin']].dropna()
        density_profit_data = density_profit_data.sort_values('stocking_density_kg_m3')
        z = np.polyfit(density_profit_data['stocking_density_kg_m3'],
                       density_profit_data['profit_margin'], 3)
        p = np.poly1d(z)
        # Objective function 
        def objective(x):
            return -p(x[0])
        
        # constraints
        min_density = density_profit_data['stocking_density_kg_m3'].min()
        max_density = density_profit_data['stocking_density_kg_m3'].max()
        bounds = [(min_density, max_density)]

        # optimize
        result = minimize(objective, 
                          x0=[(min_density + max_density) / 2],
                          bounds=bounds,
                          method='L-BFGS-B')
        optimal_density = result.x[0]
        max_profit = -result.fun

        # current average 
        current_avg_density = self.df['stocking_density_kg_m3'].mean()
        current_avg_profit = self.df['profit_margin'].mean()

        return {
            'optimal_density': float(optimal_density),
            'expected_profit_at_optimal': float(max_profit),
            'current_average_density': float(current_avg_density),
            'current_average_profit': float(current_avg_profit),
            'improvement_potential': float(max_profit - current_avg_profit),
            'polynomial_coefficients': z.tolist(),
            'optimization_success': result.success,
            'recommendation': f"Increase density to {optimal_density:.2f} kg/m³ for {((max_profit/current_avg_profit - 1)*100):.1f}% profit improvement"
        }
    
    # Time series analysis - detect trends and seasonality 
    def detect_peaks_in_mortality(self) -> Dict:
        mortality_by_age = self.df.groupby('age_days')['mortality_events'].mean().sort_index()
        peaks, properties = find_peaks(mortality_by_age.values, 
                                        height=mortality_by_age.mean(),
                                        distance=10,
                                        prominence=0.1)
        critical_ages = mortality_by_age.index[peaks].tolist()
        peak_values = mortality_by_age.values[peaks].tolist()
        return {
            'critical_age_periods': [
                {
                    'age_days': int(age),
                    'avg_mortality': float(val),
                    'risk_level': 'High' if val > mortality_by_age.quantile(0.75) else 'Elevated'
                }
                for age, val in zip(critical_ages, peak_values)
            ],
            'overall_mean_mortality': float(mortality_by_age.mean()),
            'peak_count': len(peaks),
            'recommendation': f"Monitor closely at ages: {', '.join(map(str, critical_ages[:3]))} days"
        }
    
    # Hierarchical clustering - site similarity analysis 
    def hierarchical_site_clustering(self) -> Dict:
        features = ['water_temp_c', 'dissolved_oxygen_mg_l', 'stocking_density_kg_m3',
                    'profit_margin', 'survival_rate_pct']
        
        site_data = self.df.groupby('site_id')[features].mean().dropna()

        # Standardize
        from scipy.stats import zscore
        site_data_std = site_data.apply(zscore)
        Z = linkage(site_data_std, method='ward') # Hierarchical clustering 
        clusters = fcluster(Z, t=4, criterion='maxclust')
        site_data['cluster'] = clusters

        # Analyze clusters
        cluster_profiles = {}
        for cluster_id in range(1, 5):
            cluster_sites = site_data[site_data['cluster'] == cluster_id]
            cluster_profiles[f'cluster_{cluster_id}'] = {
                'n_sites': len(cluster_sites),
                'avg_profit_margin': float(cluster_sites['profit_margin'].mean()),
                'avg_survival_rate': float(cluster_sites['survival_rate_pct'].mean()),
                'avg_temp': float(cluster_sites['water_temp_c'].mean()),
                'avg_oxygen': float(cluster_sites['dissolved_oxygen_mg_l'].mean()),
                'site_ids': cluster_sites.index.tolist(),
                'performance_tier': self._classify_performance(cluster_sites['profit_margin'].mean())
            }
        return {
            'cluster_profiles': cluster_profiles,
            'linkage_matrix': Z.tolist(),
            'recommendation' : "Focus resources on improving Cluster " +
                                    str(min(cluster_profiles.items(),
                                            key=lambda x: x[1]['avg_profit_margin'])[0].split('_')[1])
        }


    def _classify_performance(self, profit: float) -> str:
        overall_median = self.df['profit_margin'].median()
        overall_q75 = self.df['profit_margin'].quantile(0.75)

        if profit >= overall_q75:
            return "Elite"
        elif profit >= overall_median:
            return "Above Average"
        else:
            return "Needs Improvement"

    # Master analysis - run everything
    def generate_comprehensive_report(self, output_path: str = 'scipy_analysis_results.json'):

        print("Running comprehensive SciPy statistical analysis...")
        results = {
           'metadata': {
                'n_records': len(self.df),
                'n_sites': self.df['site_id'].nunique(),
                'n_species': self.df['species'].nunique(),
                'analysis_timestamp': pd.Timestamp.now().isoformat()
            }, 
           'hypothesis_testing': self.compare_species_performance(),
           'correlation_analysis': self.comprehensive_correlation_analysis(),
           'distribution_analysis': self.analyze_distributions(),
           'growth_curves': self.fit_growth_curves(),
           'optimization': self.optimize_stocking_density(),
           'mortality_peaks': self.detect_peaks_in_mortality(),
           'site_clustering': self.hierarchical_site_clustering()
        }
        with open(output_path, 'w') as f:
            results = self._convert_to_json_serializable(results)
            json.dump(results, f, indent=2)

        print(f"✓ Analysis complete! Results saved to {output_path}")
        print(f"  - {len(results['hypothesis_testing']['pairwise_comparisons'])} pairwise comparisons")
        print(f"  - {len(results['correlation_analysis']['strong_correlations'])} strong correlations found")
        print(f"  - Growth curves fit for {len(results['growth_curves'])} species")
        print(f"  - {len(results['mortality_peaks']['critical_age_periods'])} critical mortality periods identified") 

        return results

if __name__ == "__main__":
    # Initialize analysis
    analyzer = AquacultureStatisticalAnalysis('aquaculture_dataset.json')
    
    # Run comprehensive analysis
    results = analyzer.generate_comprehensive_report('scipy_analysis_results.json')
    
    # Print key findings
    print("\n" + "="*70)
    print("KEY FINDINGS")
    print("="*70)
    
    # Species comparison
    print("\n1. SPECIES PERFORMANCE:")
    anova = results['hypothesis_testing']['anova']
    print(f"   ANOVA p-value: {anova['p_value']:.4f} - {anova['interpretation']}")
    
    # Strongest correlations
    print("\n2. TOP CORRELATIONS:")
    for corr in results['correlation_analysis']['strong_correlations'][:3]:
        print(f"   {corr['pair']}: r = {corr['pearson_r']:.3f} (p = {corr['p_value']:.4f})")
    
    # Optimization
    print("\n3. OPTIMIZATION:")
    opt = results['optimization']
    print(f"   Optimal density: {opt['optimal_density']:.2f} kg/m³")
    print(f"   {opt['recommendation']}")
    
    # Mortality peaks
    print("\n4. CRITICAL MORTALITY PERIODS:")
    for period in results['mortality_peaks']['critical_age_periods'][:3]:
        print(f"   Age {period['age_days']} days: {period['risk_level']} risk")
    
    print("\n" + "="*70)
