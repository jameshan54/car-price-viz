import pandas as pd

# Sampling
df = pd.read_csv("data/car_sales_data.csv")

sampled_df = df.sample(n=1000000, random_state=42)

sampled_df.to_csv("data/car_sales_data_sampled.csv", index=False)
