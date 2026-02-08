import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional


class MonteCarlo_Simulation:
    def __init__(self,
                 n_simulations: int = 10000,
                 time_horizon_days: int = 180,
                 time_steps: int = 60,
                 random_seed: Optional[int] = 42):
        self.n_simulations = n_simulations
        self.time_horizon_days = time_horizon_days
        self.time_steps = time_steps
        self.dt = time_horizon_days / time_steps

        if random_seed is not None:
            np.random.seed(random_seed)

        # storage for simulations results
        self.scenarios = []
        self.summary_stats = {}

    def simulate_price_path_gbm(self,
                                S0: float,
                                mu: float,
                                sigma: float) -> np.ndarray:
        mu_daily = mu / 365
        sigma_daily = sigma / np.sqrt(365)
        dW = np.random.normal(0, np.sqrt(self.dt), self.time_steps)
        S = np.zeros(self.time_steps + 1)
        S[0] = S0 
        for t in range(self.time_steps):
            S[t + 1] = S[t] * np.exp((mu_daily - 0.5 * sigma_daily**2) * self.dt +
                               sigma_daily * dW[t])
        return S 

    def simulate_growth_path_jump_diffusion(self,
                                            W0: float,
                                            growth_rate: float,
                                            growth_vol: float,
                                            jump_intensity: float,
                                            jump_mean: float,
                                            jump_std: float) -> Tuple[np.ndarray, List[int]]:
        W = np.zeros(self.time_steps + 1)
        W[0] = W0
        jump_times = []

        for t in range(self.time_steps):
            dW_brownian = np.random.normal(0, np.sqrt(self.dt))
            diffusion = W[t] * (growth_rate * self.dt + growth_vol * dW_brownian)
            n_jumps = np.random.poisson(jump_intensity * self.dt)
            jump = 0
            if n_jumps > 0:
                jump_times.append(t)
                jump = W[t] * np.random.normal(jump_mean, jump_std)
            W[t + 1] = max(W[t] + diffusion + jump, 0)
        return W, jump_times
    
    def simulate_cost_path_ou(self,
                              C0: float,
                              theta: float,
                              mu: float,
                              sigma: float) -> np.ndarray:
        C = np.zeros(self.time_steps + 1)
        C[0] = C0
        for t in range(self.time_steps):
            dW = np.random.normal(0, np.sqrt(self.dt))
            C[t + 1] = C[t] + theta * (mu - C[t]) * self.dt + sigma * dW
            C[t + 1] = max(C[t + 1], 0)
        return C 
    
    def calculate_financial_metrics(self,
                                    price_path: np.ndarray,
                                    weight_path: np.ndarray,
                                    cost_path: np.ndarray,
                                    n_fish: int,
                                    survival_rate: float) -> Dict:
        final_weight_kg = weight_path[-1] / 1000
        final_price = price_path[-1]
        surviving_fish = int(n_fish * survival_rate)
        total_biomass_kg = surviving_fish * final_weight_kg
        revenue = total_biomass_kg * final_price
        total_cost = np.sum(cost_path)
        profit = revenue - total_cost
        roi = (profit / total_cost) if total_cost > 0 else 0
        profit_margin = (profit / revenue) if revenue > 0 else 0

        return {
            'revenue': revenue,
            'total_cost': total_cost,
            'profit': profit,
            'roi': roi,
            'profit_margin': profit_margin,
            'final_price': final_price,
            'final_weight_kg': final_weight_kg,
            'total_biomass_kg': total_biomass_kg,
            'surviving_fish': surviving_fish
        }
    
    def run_simulation(self,
                       site_params: Dict,
                       market_params: Dict,
                       growth_params: Dict,
                       cost_params: Dict) -> pd.DataFrame:
        print(f"Running {self.n_simulations} Monte Carlo simulations...")
        scenarios = []
        for sim_id in range(self.n_simulations):
            if (sim_id + 1) % 1000 == 0:
                print(f"  Completed {sim_id + 1}/{self.n_simulations} simulations")
            
            price_path = self.simulate_price_path_gbm(
                market_params['initial_price'],
                market_params['drift'],
                market_params['volatility']
            )

            weight_path, jump_times = self.simulate_growth_path_jump_diffusion(
                site_params['initial_weight'],
                growth_params['growth_rate'],
                growth_params['growth_vol'],
                growth_params['jump_intensity'],
                growth_params['jump_mean'],
                growth_params['jump_std']
            )

            cost_path = self.simulate_cost_path_ou(
                cost_params['initial_cost'],
                cost_params['theta'],
                cost_params['mean_cost'],
                cost_params['sigma']
            )

            survival_impact = len(jump_times) * 0.05
            survival_rate = max(growth_params['base_survival'] - survival_impact, 0.5)
            metrics = self.calculate_financial_metrics(
                price_path,
                weight_path,
                cost_path,
                site_params['n_fish'],            
                survival_rate
            )

            scenario = {
                'simulation_id': sim_id,
                'site_id': site_params['site_id'],
                'species': site_params['species'],
                'survival_rate': survival_rate,
                'n_mortality_events': len(jump_times),
                'final_price': metrics['final_price'],
                'final_weight_kg': metrics['final_weight_kg'],
                'total_biomass_kg': metrics['total_biomass_kg'],
                'surviving_fish': metrics['surviving_fish'],
                'revenue': metrics['revenue'],
                'total_cost': metrics['total_cost'],
                'profit': metrics['profit'],
                'roi': metrics['roi'],
                'profit_margin': metrics['profit_margin'],
                'price_path': price_path.tolist(),
                'weight_path': weight_path.tolist(),
                'cost_path': cost_path.tolist()
            }
            scenarios.append(scenario)
        self.scenarios = scenarios
        df = pd.DataFrame(scenarios)
        self._calculate_summary_statistics(df)
        print(f"✓ Simulation complete!")
        return df 
    
    def _calculate_summary_statistics(self, df: pd.DataFrame):
        profits = df['profit'].values
        returns = df['roi'].values
        
        # Basic statistics
        self.summary_stats = {
            'n_simulations': self.n_simulations,
            'mean_profit': float(np.mean(profits)),
            'median_profit': float(np.median(profits)),
            'std_profit': float(np.std(profits)),
            'min_profit': float(np.min(profits)),
            'max_profit': float(np.max(profits)),
            
            'mean_roi': float(np.mean(returns)),
            'median_roi': float(np.median(returns)),
            'std_roi': float(np.std(returns)),
            
            # Risk metrics
            'var_95': float(np.percentile(profits, 5)),  # 95% VaR
            'var_99': float(np.percentile(profits, 1)),  # 99% VaR
            'cvar_95': float(np.mean(profits[profits <= np.percentile(profits, 5)])),
            'cvar_99': float(np.mean(profits[profits <= np.percentile(profits, 1)])),
            
            # Probability metrics
            'prob_loss': float(np.mean(profits < 0)),
            'prob_profit': float(np.mean(profits > 0)),
            'prob_high_return': float(np.mean(returns > 0.3)),  # ROI > 30%
            
            # Sharpe ratio (assuming risk-free rate = 0 for simplicity)
            'sharpe_ratio': float(np.mean(returns) / np.std(returns)) if np.std(returns) > 0 else 0,
            
            # Percentiles
            'profit_p10': float(np.percentile(profits, 10)),
            'profit_p25': float(np.percentile(profits, 25)),
            'profit_p75': float(np.percentile(profits, 75)),
            'profit_p90': float(np.percentile(profits, 90)),
        }

    def write_to_json(self, 
                     filepath: str,
                     include_paths: bool = False):
        # Prepare scenarios for export
        scenarios_export = []
        
        for scenario in self.scenarios:
            scenario_export = scenario.copy()
            
            # Remove paths if not requested (reduces file size significantly)
            if not include_paths:
                scenario_export.pop('price_path', None)
                scenario_export.pop('weight_path', None)
                scenario_export.pop('cost_path', None)
            
            scenarios_export.append(scenario_export)
        
        # Create output structure
        output = {
            'metadata': {
                'simulation_type': 'monte_carlo_aquaculture',
                'generated_at': datetime.now().isoformat(),
                'n_simulations': self.n_simulations,
                'time_horizon_days': self.time_horizon_days,
                'time_steps': self.time_steps
            },
            'summary_statistics': self.summary_stats,
            'scenarios': scenarios_export
        }
        
        # Write to file
        with open(filepath, 'w') as f:
            json.dump(output, f, indent=2)
        
        file_size_mb = len(json.dumps(output)) / (1024 * 1024)
        print(f"✓ Saved {len(scenarios_export)} scenarios to {filepath}")
        print(f"  File size: {file_size_mb:.2f} MB")
    
    def generate_risk_report(self) -> Dict:
        df = pd.DataFrame(self.scenarios)
        
        report = {
            'risk_summary': self.summary_stats,
            
            'profit_distribution': {
                'percentiles': {
                    'p01': float(np.percentile(df['profit'], 1)),
                    'p05': float(np.percentile(df['profit'], 5)),
                    'p10': float(np.percentile(df['profit'], 10)),
                    'p25': float(np.percentile(df['profit'], 25)),
                    'p50': float(np.percentile(df['profit'], 50)),
                    'p75': float(np.percentile(df['profit'], 75)),
                    'p90': float(np.percentile(df['profit'], 90)),
                    'p95': float(np.percentile(df['profit'], 95)),
                    'p99': float(np.percentile(df['profit'], 99))
                }
            },
            
            'scenario_breakdown': {
                'loss_scenarios': int(np.sum(df['profit'] < 0)),
                'breakeven_scenarios': int(np.sum((df['profit'] >= 0) & (df['profit'] < 1000))),
                'profit_scenarios': int(np.sum(df['profit'] >= 1000)),
                'high_profit_scenarios': int(np.sum(df['profit'] > df['profit'].quantile(0.9)))
            },
            
            'recommendations': self._generate_recommendations(df)
        }
        
        return report
    
    def _generate_recommendations(self, df: pd.DataFrame) -> List[str]:
        """Generate actionable recommendations based on simulation results"""
        recommendations = []
        
        prob_loss = self.summary_stats['prob_loss']
        sharpe = self.summary_stats['sharpe_ratio']
        mean_roi = self.summary_stats['mean_roi']
        
        if prob_loss > 0.2:
            recommendations.append(
                f"High risk: {prob_loss*100:.1f}% probability of loss. Consider risk mitigation strategies."
            )
        
        if sharpe < 1.0:
            recommendations.append(
                f"Low risk-adjusted returns (Sharpe: {sharpe:.2f}). Optimize operational efficiency."
            )
        
        if mean_roi > 0.25:
            recommendations.append(
                f"Strong expected returns (ROI: {mean_roi*100:.1f}%). Continue current strategy."
            )
        
        if df['n_mortality_events'].mean() > 2:
            recommendations.append(
                "High mortality event frequency. Improve biosecurity and health monitoring."
            )
        
        return recommendations


# Example usage demonstration
if __name__ == "__main__":
    # Initialize simulator
    mc = MonteCarlo_Simulation(
        n_simulations=5000,
        time_horizon_days=180,
        time_steps=60,
        random_seed=42
    )
    
    # Define parameters
    site_params = {
        'site_id': 1,
        'species': 'Salmon',
        'n_fish': 10000,
        'initial_weight': 50.0  # grams
    }
    
    market_params = {
        'initial_price': 15.50,  # $/kg
        'drift': 0.05,  # 5% annual drift
        'volatility': 0.25  # 25% annual volatility
    }
    
    growth_params = {
        'growth_rate': 0.015,  # 1.5% daily growth
        'growth_vol': 0.05,  # 5% growth volatility
        'jump_intensity': 0.01,  # 1% chance of mortality event per day
        'jump_mean': -0.10,  # -10% biomass loss per event
        'jump_std': 0.05,  # 5% std dev
        'base_survival': 0.92  # 92% base survival
    }
    
    cost_params = {
        'initial_cost': 500.0,  # $/day
        'mean_cost': 480.0,  # Long-term mean
        'theta': 0.1,  # Mean reversion speed
        'sigma': 50.0  # Cost volatility
    }
    
    # Run simulation
    results_df = mc.run_simulation(site_params, market_params, growth_params, cost_params)
    
    # Save results
    mc.write_to_json('monte_carlo_results.json', include_paths=False)
    
    # Generate risk report
    risk_report = mc.generate_risk_report()
    print("\n=== RISK REPORT ===")
    print(f"Mean Profit: ${risk_report['risk_summary']['mean_profit']:,.2f}")
    print(f"95% VaR: ${risk_report['risk_summary']['var_95']:,.2f}")
    print(f"Sharpe Ratio: {risk_report['risk_summary']['sharpe_ratio']:.2f}")
    print(f"Probability of Loss: {risk_report['risk_summary']['prob_loss']*100:.1f}%")
    print("\nRecommendations:")
    for rec in risk_report['recommendations']:
        print(f"  {rec}")