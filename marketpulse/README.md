# MarketPulse Analytics

AI-Based Marketing Campaign Analysis System.

## Files
- `marketing_campaigns.csv` — Synthetic dataset (5,000 rows, 17 columns)
- `MarketPulse_Analytics.ipynb` — Executed Jupyter notebook with all results & charts

## Models
1. **K-Means** — Customer segmentation into High / Medium / Low value
2. **Logistic Regression** — Conversion prediction (Will Convert: Yes/No)
3. **Isolation Forest** — Campaign anomaly detection
4. **Bonus** — Channel recommendation + Predicted ROI per channel

## Run locally
```bash
pip install pandas numpy scikit-learn matplotlib seaborn jupyter
jupyter notebook MarketPulse_Analytics.ipynb
```

## Dataset schema
`customer_id, campaign_id, channel, region, device, age, income, tenure_months,
prev_purchases, session_duration_min, pages_viewed, spend, impressions, clicks,
conversions, revenue, converted`

## Viva pitch
> "We built an end-to-end marketing analytics system where raw campaign data is
> processed, analyzed using machine learning models, and visualized to support
> data-driven decision-making."
