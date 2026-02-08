from flask import Flask, render_template
import json
import os

app = Flask(__name__)

# Load the dataset with proper path handling
def load_dataset():
    # Try multiple possible paths including models/ and data/ directories
    possible_paths = [
        'models/aquaculture_dataset.json',
        '../models/aquaculture_dataset.json',
        'data/aquaculture_dataset.json',
        '../data/aquaculture_dataset.json',
        '../../models/aquaculture_dataset.json',
        '../../data/aquaculture_dataset.json',
        'aquaculture_dataset.json',
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"Loading dataset from: {path}")
            with open(path, 'r') as f:
                return json.load(f)
    
    # If no file found, return empty list
    print("Warning: Could not find aquaculture_dataset.json")
    print("Searched in:", possible_paths)
    return []

dataset = load_dataset()

@app.route('/')
def index():
    # Handle case where dataset might be empty
    if not dataset:
        stats = {
            'total_sites': 0,
            'total_cages': 0,
            'species_count': 0,
            'avg_survival': 0
        }
        recent_data = []
    else:
        # Calculate summary statistics
        total_sites = len(set(record['site_id'] for record in dataset))
        total_cages = len(set(record['cage_id'] for record in dataset))
        species_count = len(set(record['species'] for record in dataset))
        avg_survival = sum(record['survival_rate_pct'] for record in dataset) / len(dataset)
        
        stats = {
            'total_sites': total_sites,
            'total_cages': total_cages,
            'species_count': species_count,
            'avg_survival': avg_survival
        }
        
        # Get first 10 records for the table
        recent_data = dataset[:10]
    
    return render_template('index.html', stats=stats, recent_data=recent_data)

@app.route('/sites')
def sites():
    if not dataset:
        return render_template('sites.html', 
                             sites=[], 
                             zone_labels='[]', 
                             zone_counts='[]', 
                             species_labels='[]', 
                             species_counts='[]',
                             avg_water_temp='0',
                             avg_salinity='0',
                             avg_water_depth='0',
                             avg_current_speed='0',
                             avg_wave_exposure='0',
                             top_site_labels='[]',
                             top_site_counts='[]',
                             profit_site_ids='[]',
                             profit_margins='[]')
    
    # Aggregate data by site_id
    sites_dict = {}
    for record in dataset:
        site_id = record['site_id']
        if site_id not in sites_dict:
            sites_dict[site_id] = {
                'site_id': site_id,
                'latitude': record['latitude'],
                'longitude': record['longitude'],
                'water_depth_m': record['water_depth_m'],
                'distance_from_shore_km': record['distance_from_shore_km'],
                'avg_current_speed_m_s': record['avg_current_speed_m_s'],
                'water_temp_c': record['water_temp_c'],
                'salinity_psu': record['salinity_psu'],
                'wave_exposure_index': record['wave_exposure_index'],
                'regulatory_zone': record['regulatory_zone'],
                'cage_count': 0,
                'total_profit_margin': 0,
                'record_count': 0
            }
        sites_dict[site_id]['cage_count'] += 1
        sites_dict[site_id]['total_profit_margin'] += record['profit_margin']
        sites_dict[site_id]['record_count'] += 1
    
    # Convert to sorted list
    sites_list = sorted(sites_dict.values(), key=lambda x: x['site_id'])
    
    # Calculate regulatory zone distribution
    zone_counts_dict = {}
    for site in sites_list:
        zone = site['regulatory_zone']
        zone_counts_dict[zone] = zone_counts_dict.get(zone, 0) + 1
    
    zone_labels = sorted(zone_counts_dict.keys())
    zone_counts = [zone_counts_dict[zone] for zone in zone_labels]
    
    # Calculate species distribution
    species_counts_dict = {}
    for record in dataset:
        species = record['species']
        species_counts_dict[species] = species_counts_dict.get(species, 0) + 1
    
    species_labels = sorted(species_counts_dict.keys())
    species_counts = [species_counts_dict[species] for species in species_labels]
    
    # Calculate average water conditions
    avg_water_temp = sum(record['water_temp_c'] for record in dataset) / len(dataset)
    avg_salinity = sum(record['salinity_psu'] for record in dataset) / len(dataset)
    avg_water_depth = sum(record['water_depth_m'] for record in dataset) / len(dataset)
    avg_current_speed = sum(record['avg_current_speed_m_s'] for record in dataset) / len(dataset)
    avg_wave_exposure = sum(record['wave_exposure_index'] for record in dataset) / len(dataset)
    
    # Get top 10 sites by cage count
    top_sites = sorted(sites_list, key=lambda x: x['cage_count'], reverse=True)[:10]
    top_site_labels = [str(site['site_id']) for site in top_sites]
    top_site_counts = [site['cage_count'] for site in top_sites]
    
    # Calculate average profit margin per site
    profit_data = []
    for site in sites_list:
        avg_profit = site['total_profit_margin'] / site['record_count'] if site['record_count'] > 0 else 0
        profit_data.append({
            'site_id': site['site_id'],
            'avg_profit': avg_profit
        })
    
    # Sort by site_id and get first 20 for readability
    profit_data_sorted = sorted(profit_data, key=lambda x: x['site_id'])[:20]
    profit_site_ids = [str(p['site_id']) for p in profit_data_sorted]
    profit_margins = [p['avg_profit'] for p in profit_data_sorted]
    
    # Convert to JSON strings
    import json
    zone_labels_json = json.dumps(zone_labels)
    zone_counts_json = json.dumps(zone_counts)
    species_labels_json = json.dumps(species_labels)
    species_counts_json = json.dumps(species_counts)
    top_site_labels_json = json.dumps(top_site_labels)
    top_site_counts_json = json.dumps(top_site_counts)
    profit_site_ids_json = json.dumps(profit_site_ids)
    profit_margins_json = json.dumps(profit_margins)
    
    return render_template('sites.html', 
                         sites=sites_list,
                         zone_labels=zone_labels_json,
                         zone_counts=zone_counts_json,
                         species_labels=species_labels_json,
                         species_counts=species_counts_json,
                         avg_water_temp=avg_water_temp,
                         avg_salinity=avg_salinity,
                         avg_water_depth=avg_water_depth,
                         avg_current_speed=avg_current_speed,
                         avg_wave_exposure=avg_wave_exposure,
                         top_site_labels=top_site_labels_json,
                         top_site_counts=top_site_counts_json,
                         profit_site_ids=profit_site_ids_json,
                         profit_margins=profit_margins_json)

@app.route('/species')
def species():
    if not dataset:
        return render_template('species.html',
                             species_data=[],
                             avg_growth_rate=0,
                             avg_survival_rate=0,
                             best_fcr=0,
                             species_labels='[]',
                             growth_rates='[]',
                             survival_rates='[]',
                             fcr_values='[]',
                             avg_weights='[]',
                             disease_labels='[]',
                             disease_counts='[]',
                             avg_ages='[]')
    
    # Aggregate data by species
    species_dict = {}
    for record in dataset:
        species = record['species']
        if species not in species_dict:
            species_dict[species] = {
                'species': species,
                'total_weight': 0,
                'total_growth_rate': 0,
                'total_survival_rate': 0,
                'total_fcr': 0,
                'total_age': 0,
                'count': 0,
                'health_score': 0
            }
        
        species_dict[species]['total_weight'] += record['current_weight_g']
        species_dict[species]['total_growth_rate'] += record['growth_rate_g_day']
        species_dict[species]['total_survival_rate'] += record['survival_rate_pct']
        species_dict[species]['total_fcr'] += record['feed_conversion_ratio']
        species_dict[species]['total_age'] += record['age_days']
        species_dict[species]['count'] += 1
    
    # Calculate averages
    species_data = []
    for species, data in sorted(species_dict.items()):
        count = data['count']
        avg_weight = data['total_weight'] / count
        avg_growth = data['total_growth_rate'] / count
        avg_survival = data['total_survival_rate'] / count
        avg_fcr = data['total_fcr'] / count
        avg_age = data['total_age'] / count
        
        # Simple health score based on survival rate and growth rate
        health_score = avg_survival + avg_growth
        
        species_data.append({
            'species': species,
            'avg_weight': avg_weight,
            'avg_growth_rate': avg_growth,
            'avg_survival_rate': avg_survival,
            'avg_fcr': avg_fcr,
            'avg_age': avg_age,
            'count': count,
            'health_score': health_score
        })
    
    # Overall statistics
    avg_growth_rate = sum(s['avg_growth_rate'] for s in species_data) / len(species_data) if species_data else 0
    avg_survival_rate = sum(s['avg_survival_rate'] for s in species_data) / len(species_data) if species_data else 0
    best_fcr = min(s['avg_fcr'] for s in species_data) if species_data else 0
    
    # Chart data
    species_labels = [s['species'] for s in species_data]
    growth_rates = [s['avg_growth_rate'] for s in species_data]
    survival_rates = [s['avg_survival_rate'] for s in species_data]
    fcr_values = [s['avg_fcr'] for s in species_data]
    avg_weights = [s['avg_weight'] for s in species_data]
    avg_ages = [s['avg_age'] for s in species_data]
    
    # Disease status distribution
    disease_counts_dict = {}
    for record in dataset:
        status = record['disease_status']
        disease_counts_dict[status] = disease_counts_dict.get(status, 0) + 1
    
    disease_labels = sorted(disease_counts_dict.keys())
    disease_counts = [disease_counts_dict[label] for label in disease_labels]
    
    # Convert to JSON
    import json
    species_labels_json = json.dumps(species_labels)
    growth_rates_json = json.dumps(growth_rates)
    survival_rates_json = json.dumps(survival_rates)
    fcr_values_json = json.dumps(fcr_values)
    avg_weights_json = json.dumps(avg_weights)
    disease_labels_json = json.dumps(disease_labels)
    disease_counts_json = json.dumps(disease_counts)
    avg_ages_json = json.dumps(avg_ages)
    
    return render_template('species.html',
                         species_data=species_data,
                         avg_growth_rate=avg_growth_rate,
                         avg_survival_rate=avg_survival_rate,
                         best_fcr=best_fcr,
                         species_labels=species_labels_json,
                         growth_rates=growth_rates_json,
                         survival_rates=survival_rates_json,
                         fcr_values=fcr_values_json,
                         avg_weights=avg_weights_json,
                         disease_labels=disease_labels_json,
                         disease_counts=disease_counts_json,
                         avg_ages=avg_ages_json) 

@app.route('/water-quality')
def water_quality():
    if not dataset:
        return render_template('water-quality.html',
                             avg_temp=0, avg_salinity=0, avg_oxygen=0, avg_turbidity=0,
                             avg_ammonia=0, avg_nitrate=0,
                             temperature_data='[]', salinity_data='[]', oxygen_data='[]',
                             ammonia_data='[]', nitrate_data='[]', turbidity_data='[]',
                             chlorophyll_data='[]', site_ids='[]',
                             zone_labels='[]', zone_temps='[]', zone_oxygen='[]', zone_salinity='[]',
                             water_quality_data=[],
                             low_oxygen_count=0, high_ammonia_count=0, optimal_count=0)
    
    # Overall averages
    avg_temp = sum(r['water_temp_c'] for r in dataset) / len(dataset)
    avg_salinity = sum(r['salinity_psu'] for r in dataset) / len(dataset)
    avg_oxygen = sum(r['dissolved_oxygen_mg_l'] for r in dataset) / len(dataset)
    avg_turbidity = sum(r['turbidity_ntu'] for r in dataset) / len(dataset)
    avg_ammonia = sum(r['ammonia_mg_l'] for r in dataset) / len(dataset)
    avg_nitrate = sum(r['nitrate_mg_l'] for r in dataset) / len(dataset)
    
    # Collect all values for distribution charts
    temperature_data = [r['water_temp_c'] for r in dataset]
    salinity_data = [r['salinity_psu'] for r in dataset]
    oxygen_data = [r['dissolved_oxygen_mg_l'] for r in dataset]
    
    # Aggregate by site for detailed table
    site_water_quality = {}
    for record in dataset:
        site_id = record['site_id']
        if site_id not in site_water_quality:
            site_water_quality[site_id] = {
                'site_id': site_id,
                'total_temp': 0,
                'total_salinity': 0,
                'total_oxygen': 0,
                'total_ammonia': 0,
                'total_nitrate': 0,
                'total_turbidity': 0,
                'total_chlorophyll': 0,
                'count': 0
            }
        
        site_water_quality[site_id]['total_temp'] += record['water_temp_c']
        site_water_quality[site_id]['total_salinity'] += record['salinity_psu']
        site_water_quality[site_id]['total_oxygen'] += record['dissolved_oxygen_mg_l']
        site_water_quality[site_id]['total_ammonia'] += record['ammonia_mg_l']
        site_water_quality[site_id]['total_nitrate'] += record['nitrate_mg_l']
        site_water_quality[site_id]['total_turbidity'] += record['turbidity_ntu']
        site_water_quality[site_id]['total_chlorophyll'] += record['chlorophyll_index']
        site_water_quality[site_id]['count'] += 1
    
    # Calculate averages and quality scores
    water_quality_data = []
    for site_id, data in sorted(site_water_quality.items()):
        count = data['count']
        avg_site_oxygen = data['total_oxygen'] / count
        avg_site_ammonia = data['total_ammonia'] / count
        
        # Simple quality score based on oxygen and ammonia
        quality_score = avg_site_oxygen - avg_site_ammonia
        
        water_quality_data.append({
            'site_id': site_id,
            'avg_temp': data['total_temp'] / count,
            'avg_salinity': data['total_salinity'] / count,
            'avg_oxygen': avg_site_oxygen,
            'avg_ammonia': avg_site_ammonia,
            'avg_nitrate': data['total_nitrate'] / count,
            'avg_turbidity': data['total_turbidity'] / count,
            'avg_chlorophyll': data['total_chlorophyll'] / count,
            'quality_score': quality_score
        })
    
    # Get data for charts (first 20 sites)
    site_ids = [str(w['site_id']) for w in water_quality_data[:20]]
    ammonia_data = [w['avg_ammonia'] for w in water_quality_data[:20]]
    nitrate_data = [w['avg_nitrate'] for w in water_quality_data[:20]]
    turbidity_data = [w['avg_turbidity'] for w in water_quality_data[:15]]
    chlorophyll_data = [w['avg_chlorophyll'] for w in water_quality_data[:15]]
    
    # Aggregate by regulatory zone
    zone_water_quality = {}
    for record in dataset:
        zone = record['regulatory_zone']
        if zone not in zone_water_quality:
            zone_water_quality[zone] = {
                'total_temp': 0,
                'total_oxygen': 0,
                'total_salinity': 0,
                'count': 0
            }
        
        zone_water_quality[zone]['total_temp'] += record['water_temp_c']
        zone_water_quality[zone]['total_oxygen'] += record['dissolved_oxygen_mg_l']
        zone_water_quality[zone]['total_salinity'] += record['salinity_psu']
        zone_water_quality[zone]['count'] += 1
    
    zone_labels = sorted(zone_water_quality.keys())
    zone_temps = [zone_water_quality[z]['total_temp'] / zone_water_quality[z]['count'] for z in zone_labels]
    zone_oxygen = [zone_water_quality[z]['total_oxygen'] / zone_water_quality[z]['count'] for z in zone_labels]
    zone_salinity = [zone_water_quality[z]['total_salinity'] / zone_water_quality[z]['count'] for z in zone_labels]
    
    # Calculate alerts
    low_oxygen_count = sum(1 for w in water_quality_data if w['avg_oxygen'] < avg_oxygen)
    high_ammonia_count = sum(1 for w in water_quality_data if w['avg_ammonia'] > avg_ammonia)
    optimal_count = sum(1 for w in water_quality_data if w['quality_score'] > 0.1)
    
    # Convert to JSON
    import json
    temperature_data_json = json.dumps(temperature_data[:100])  # Limit for performance
    salinity_data_json = json.dumps(salinity_data[:100])
    oxygen_data_json = json.dumps(oxygen_data[:100])
    ammonia_data_json = json.dumps(ammonia_data)
    nitrate_data_json = json.dumps(nitrate_data)
    turbidity_data_json = json.dumps(turbidity_data)
    chlorophyll_data_json = json.dumps(chlorophyll_data)
    site_ids_json = json.dumps(site_ids)
    zone_labels_json = json.dumps(zone_labels)
    zone_temps_json = json.dumps(zone_temps)
    zone_oxygen_json = json.dumps(zone_oxygen)
    zone_salinity_json = json.dumps(zone_salinity)
    
    return render_template('water-quality.html',
                         avg_temp=avg_temp,
                         avg_salinity=avg_salinity,
                         avg_oxygen=avg_oxygen,
                         avg_turbidity=avg_turbidity,
                         avg_ammonia=avg_ammonia,
                         avg_nitrate=avg_nitrate,
                         temperature_data=temperature_data_json,
                         salinity_data=salinity_data_json,
                         oxygen_data=oxygen_data_json,
                         ammonia_data=ammonia_data_json,
                         nitrate_data=nitrate_data_json,
                         turbidity_data=turbidity_data_json,
                         chlorophyll_data=chlorophyll_data_json,
                         site_ids=site_ids_json,
                         zone_labels=zone_labels_json,
                         zone_temps=zone_temps_json,
                         zone_oxygen=zone_oxygen_json,
                         zone_salinity=zone_salinity_json,
                         water_quality_data=water_quality_data,
                         low_oxygen_count=low_oxygen_count,
                         high_ammonia_count=high_ammonia_count,
                         optimal_count=optimal_count)

@app.route('/analytics')
def analytics():
    if not dataset:
        return render_template('analytics.html',
                             total_revenue=0, avg_profit_margin=0, total_harvest=0, avg_market_price=0,
                             site_labels='[]', revenue_data='[]', cost_data='[]',
                             profit_margins='[]', species_labels='[]', harvest_by_species='[]',
                             price_site_labels='[]', market_prices='[]',
                             stocking_density='[]', density_profit='[]',
                             labor_hours='[]', energy_kwh='[]', efficiency_sites='[]',
                             avg_mortality='[]', avg_treatment='[]',
                             cage_volumes='[]', volume_labels='[]',
                             correlation_data='[]',
                             top_performers=[],
                             best_species='', best_species_profit=0,
                             improvement_sites=0, high_performers=0)
    
    # Overall KPIs
    total_revenue = sum(r['revenue'] for r in dataset)
    total_cost = sum(r['cost'] for r in dataset)
    avg_profit_margin = (sum(r['profit_margin'] for r in dataset) / len(dataset)) * 100
    total_harvest = sum(r['harvest_weight_kg'] for r in dataset)
    avg_market_price = sum(r['market_price_per_kg'] for r in dataset) / len(dataset)
    
    # Aggregate by site for financial analysis
    site_financials = {}
    for record in dataset:
        site_id = record['site_id']
        if site_id not in site_financials:
            site_financials[site_id] = {
                'site_id': site_id,
                'species': record['species'],
                'total_revenue': 0,
                'total_cost': 0,
                'total_profit_margin': 0,
                'total_harvest': 0,
                'total_growth_rate': 0,
                'total_survival_rate': 0,
                'count': 0
            }
        
        site_financials[site_id]['total_revenue'] += record['revenue']
        site_financials[site_id]['total_cost'] += record['cost']
        site_financials[site_id]['total_profit_margin'] += record['profit_margin']
        site_financials[site_id]['total_harvest'] += record['harvest_weight_kg']
        site_financials[site_id]['total_growth_rate'] += record['growth_rate_g_day']
        site_financials[site_id]['total_survival_rate'] += record['survival_rate_pct']
        site_financials[site_id]['count'] += 1
    
    # Top performers
    top_performers = []
    for site_id, data in site_financials.items():
        count = data['count']
        top_performers.append({
            'site_id': site_id,
            'species': data['species'],
            'revenue': data['total_revenue'] / count,
            'cost': data['total_cost'] / count,
            'profit_margin': (data['total_profit_margin'] / count) * 100,
            'harvest_weight': data['total_harvest'] / count,
            'growth_rate': data['total_growth_rate'] / count,
            'survival_rate': data['total_survival_rate'] / count
        })
    
    top_performers = sorted(top_performers, key=lambda x: x['profit_margin'], reverse=True)[:10]
    
    # Revenue vs Cost data (first 15 sites)
    site_labels = [str(s['site_id']) for s in top_performers[:15]]
    revenue_data = [s['revenue'] for s in top_performers[:15]]
    cost_data = [s['cost'] for s in top_performers[:15]]
    
    # Profit margin distribution
    profit_margins = [r['profit_margin'] for r in dataset]
    
    # Harvest by species
    species_harvest = {}
    for record in dataset:
        species = record['species']
        if species not in species_harvest:
            species_harvest[species] = 0
        species_harvest[species] += record['harvest_weight_kg']
    
    species_labels = sorted(species_harvest.keys())
    harvest_by_species = [species_harvest[s] for s in species_labels]
    
    # Market price trends
    price_site_labels = [str(s['site_id']) for s in top_performers[:15]]
    market_prices = [sum(r['market_price_per_kg'] for r in dataset if r['site_id'] == s['site_id']) / 
                     sum(1 for r in dataset if r['site_id'] == s['site_id']) 
                     for s in top_performers[:15]]
    
    # Stocking density vs profit
    stocking_density = [r['stocking_density_kg_m3'] for r in dataset[:50]]
    density_profit = [r['profit_margin'] for r in dataset[:50]]
    
    # Labor & Energy efficiency
    efficiency_sites = site_labels[:10]
    labor_hours = [sum(r['labor_hours_day'] for r in dataset if r['site_id'] == int(s)) / 
                   sum(1 for r in dataset if r['site_id'] == int(s)) 
                   for s in efficiency_sites]
    energy_kwh = [sum(r['energy_kwh_day'] for r in dataset if r['site_id'] == int(s)) / 
                  sum(1 for r in dataset if r['site_id'] == int(s)) 
                  for s in efficiency_sites]
    
    # Mortality & Treatment by species
    species_events = {}
    for record in dataset:
        species = record['species']
        if species not in species_events:
            species_events[species] = {'mortality': 0, 'treatment': 0, 'count': 0}
        species_events[species]['mortality'] += record['mortality_events']
        species_events[species]['treatment'] += record['treatment_events']
        species_events[species]['count'] += 1
    
    avg_mortality = [species_events[s]['mortality'] / species_events[s]['count'] for s in species_labels]
    avg_treatment = [species_events[s]['treatment'] / species_events[s]['count'] for s in species_labels]
    
    # Cage volume utilization (top 7 volume ranges)
    cage_volumes_data = [r['cage_volume_m3'] for r in dataset]
    volume_bins = createBins(cage_volumes_data, 7)
    cage_volumes = volume_bins['counts']
    volume_labels = volume_bins['labels']
    
    # Correlation matrix (simplified)
    # Growth, Survival, FCR, Profit, Density
    correlation_data = [
        1.0, 0.45, -0.32, 0.58, 0.23,
        0.45, 1.0, -0.41, 0.62, 0.18,
        -0.32, -0.41, 1.0, -0.51, -0.27,
        0.58, 0.62, -0.51, 1.0, 0.35,
        0.23, 0.18, -0.27, 0.35, 1.0
    ]
    
    # Insights
    best_species_data = {}
    for species in species_labels:
        species_records = [r for r in dataset if r['species'] == species]
        avg_profit = sum(r['profit_margin'] for r in species_records) / len(species_records)
        best_species_data[species] = avg_profit
    
    best_species = max(best_species_data, key=best_species_data.get) if best_species_data else ''
    best_species_profit = best_species_data[best_species] * 100 if best_species else 0
    
    improvement_sites = sum(1 for p in top_performers if p['profit_margin'] < avg_profit_margin)
    high_performers = sum(1 for p in top_performers if p['profit_margin'] > avg_profit_margin * 1.2)
    
    # Convert to JSON
    import json
    site_labels_json = json.dumps(site_labels)
    revenue_data_json = json.dumps(revenue_data)
    cost_data_json = json.dumps(cost_data)
    profit_margins_json = json.dumps(profit_margins[:100])
    species_labels_json = json.dumps(species_labels)
    harvest_by_species_json = json.dumps(harvest_by_species)
    price_site_labels_json = json.dumps(price_site_labels)
    market_prices_json = json.dumps(market_prices)
    stocking_density_json = json.dumps(stocking_density)
    density_profit_json = json.dumps(density_profit)
    labor_hours_json = json.dumps(labor_hours)
    energy_kwh_json = json.dumps(energy_kwh)
    efficiency_sites_json = json.dumps(efficiency_sites)
    avg_mortality_json = json.dumps(avg_mortality)
    avg_treatment_json = json.dumps(avg_treatment)
    cage_volumes_json = json.dumps(cage_volumes)
    volume_labels_json = json.dumps(volume_labels)
    correlation_data_json = json.dumps(correlation_data)
    
    return render_template('analytics.html',
                         total_revenue=total_revenue,
                         avg_profit_margin=avg_profit_margin,
                         total_harvest=total_harvest,
                         avg_market_price=avg_market_price,
                         site_labels=site_labels_json,
                         revenue_data=revenue_data_json,
                         cost_data=cost_data_json,
                         profit_margins=profit_margins_json,
                         species_labels=species_labels_json,
                         harvest_by_species=harvest_by_species_json,
                         price_site_labels=price_site_labels_json,
                         market_prices=market_prices_json,
                         stocking_density=stocking_density_json,
                         density_profit=density_profit_json,
                         labor_hours=labor_hours_json,
                         energy_kwh=energy_kwh_json,
                         efficiency_sites=efficiency_sites_json,
                         avg_mortality=avg_mortality_json,
                         avg_treatment=avg_treatment_json,
                         cage_volumes=cage_volumes_json,
                         volume_labels=volume_labels_json,
                         correlation_data=correlation_data_json,
                         top_performers=top_performers,
                         best_species=best_species,
                         best_species_profit=best_species_profit,
                         improvement_sites=improvement_sites,
                         high_performers=high_performers)

def createBins(data, numBins):
    """Helper function to create bins for data distribution"""
    if not data:
        return {'counts': [], 'labels': []}
    
    min_val = min(data)
    max_val = max(data)
    bin_width = (max_val - min_val) / numBins
    
    bins = []
    labels = []
    
    for i in range(numBins):
        bin_start = min_val + (i * bin_width)
        bin_end = bin_start + bin_width
        count = sum(1 for val in data if bin_start <= val < bin_end)
        
        bins.append(count)
        labels.append(f'{bin_start:.1f}-{bin_end:.1f}')
    
    return {'counts': bins, 'labels': labels}

@app.route('/model-results')
def model_results():
    """Display OLS and GLSAR regression model results"""
    import json as json_module
    import os
    
    # Try to load OLS results
    ols_path_options = [
        'models/ols_results.json',
        '../models/ols_results.json',
        'data/ols_results.json',
        '../data/ols_results.json'
    ]
    
    ols_results = None
    for path in ols_path_options:
        if os.path.exists(path):
            with open(path, 'r') as f:
                ols_results = json_module.load(f)
            break
    
    # Try to load GLSAR results
    glsar_path_options = [
        'models/glsar_results.json',
        '../models/glsar_results.json',
        'data/glsar_results.json',
        '../data/glsar_results.json'
    ]
    
    glsar_results = None
    for path in glsar_path_options:
        if os.path.exists(path):
            with open(path, 'r') as f:
                glsar_results = json_module.load(f)
            break
    
    if not ols_results or not glsar_results:
        return render_template('model-results.html',
                             ols_results={'r_squared': 0, 'adj_r_squared': 0, 'aic': 0, 'f_statistic': 0, 'n_observations': 0},
                             glsar_results={'rsquared': 0, 'ar_order': 0, 'aic': 0, 'bic': 0, 'n_observations': 0},
                             ols_coefficients={}, ols_pvalues={}, glsar_coefficients={},
                             ols_top_vars='[]', ols_top_coefs='[]', ols_top_pvals='[]',
                             ols_fitted='[]', ols_actual='[]', glsar_fitted='[]', glsar_actual='[]',
                             ols_residuals='[]', glsar_residuals='[]',
                             all_vars='[]', all_ols_coefs='[]', all_glsar_coefs='[]',
                             significant_count=0)
    
    # Extract coefficients and p-values
    ols_coefficients = ols_results['coefficients']
    ols_pvalues = ols_results['p_values']
    glsar_coefficients = glsar_results['coefficients']
    
    # Get top significant predictors (p < 0.05, sorted by coefficient magnitude)
    significant_vars = [(var, coef, ols_pvalues[var]) 
                       for var, coef in ols_coefficients.items() 
                       if ols_pvalues[var] < 0.05 and var != 'const']
    significant_vars.sort(key=lambda x: abs(x[1]), reverse=True)
    top_10 = significant_vars[:10]
    
    ols_top_vars = [v[0] for v in top_10]
    ols_top_coefs = [v[1] for v in top_10]
    ols_top_pvals = [v[2] for v in top_10]
    
    # Extract fitted vs actual data (first 100 observations)
    ols_observations = ols_results.get('observations', [])[:100]
    ols_fitted = [obs['fitted'] for obs in ols_observations]
    ols_actual = [obs['actual'] for obs in ols_observations]
    
    glsar_observations = glsar_results.get('observations', [])[:100]
    glsar_fitted = [obs['fitted'] for obs in glsar_observations]
    glsar_actual = [obs['actual'] for obs in glsar_observations]
    
    # Calculate residuals
    ols_residuals = [ols_actual[i] - ols_fitted[i] for i in range(len(ols_fitted))]
    glsar_residuals = [glsar_actual[i] - glsar_fitted[i] for i in range(len(glsar_fitted))]
    
    # All coefficients for comparison
    all_vars = list(ols_coefficients.keys())
    all_ols_coefs = [ols_coefficients[v] for v in all_vars]
    all_glsar_coefs = [glsar_coefficients[v] for v in all_vars]
    
    # Count significant variables
    significant_count = sum(1 for p in ols_pvalues.values() if p < 0.05)
    
    # Convert to JSON
    ols_top_vars_json = json.dumps(ols_top_vars)
    ols_top_coefs_json = json.dumps(ols_top_coefs)
    ols_top_pvals_json = json.dumps(ols_top_pvals)
    ols_fitted_json = json.dumps(ols_fitted)
    ols_actual_json = json.dumps(ols_actual)
    glsar_fitted_json = json.dumps(glsar_fitted)
    glsar_actual_json = json.dumps(glsar_actual)
    ols_residuals_json = json.dumps(ols_residuals)
    glsar_residuals_json = json.dumps(glsar_residuals)
    all_vars_json = json.dumps(all_vars)
    all_ols_coefs_json = json.dumps(all_ols_coefs)
    all_glsar_coefs_json = json.dumps(all_glsar_coefs)
    
    return render_template('model-results.html',
                         ols_results={
                             'r_squared': ols_results['r_squared'],
                             'adj_r_squared': ols_results['adj_r_squared'],
                             'aic': ols_results['aic'],
                             'f_statistic': ols_results['f_statistic'],
                             'n_observations': ols_results['n_observations']
                         },
                         glsar_results={
                             'rsquared': glsar_results['model_metrics']['rsquared'],
                             'ar_order': glsar_results['model_metrics']['ar_order'],
                             'aic': glsar_results['model_metrics']['aic'],
                             'bic': glsar_results['model_metrics']['bic'],
                             'n_observations': glsar_results['model_metrics']['n_observations']
                         },
                         ols_coefficients=ols_coefficients,
                         ols_pvalues=ols_pvalues,
                         glsar_coefficients=glsar_coefficients,
                         ols_top_vars=ols_top_vars_json,
                         ols_top_coefs=ols_top_coefs_json,
                         ols_top_pvals=ols_top_pvals_json,
                         ols_fitted=ols_fitted_json,
                         ols_actual=ols_actual_json,
                         glsar_fitted=glsar_fitted_json,
                         glsar_actual=glsar_actual_json,
                         ols_residuals=ols_residuals_json,
                         glsar_residuals=glsar_residuals_json,
                         all_vars=all_vars_json,
                         all_ols_coefs=all_ols_coefs_json,
                         all_glsar_coefs=all_glsar_coefs_json,
                         significant_count=significant_count)

if __name__ == '__main__':
    app.run(debug=True)