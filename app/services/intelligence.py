from typing import List
from app.models import SalesData
import numpy as np

class IntelligenceService:
    def detect_sales_anomalies(self, sales_history: List[SalesData]):
        """
        Detects spikes or drops in sales using simple statistical method (Z-score).
        """
        if not sales_history or len(sales_history) < 5:
            return {"status": "insufficient_data"}
        
        # Extract units sold
        data_points = [s.units_sold for s in sales_history]
        mean = np.mean(data_points)
        std = np.std(data_points)
        
        anomalies = []
        if std > 0:
            for s in sales_history:
                z_score = (s.units_sold - mean) / std
                if z_score > 2:
                    anomalies.append({
                        "date": s.date,
                        "type": "spike",
                        "value": s.units_sold,
                        "z_score": z_score
                    })
                elif z_score < -2:
                    anomalies.append({
                        "date": s.date,
                        "type": "drop",
                        "value": s.units_sold,
                        "z_score": z_score
                    })
        
        return {
            "anomalies": anomalies, 
            "statistics": {"mean": mean, "std": std}
        }

    def generate_recommendations(self, anomalies):
        recommendations = []
        
        # Sales drop recommendations
        drops = [a for a in anomalies if a['type'] == 'drop']
        if drops:
            recommendations.append("Low Demand Alert: We detected an unexpected dip in sales. Check for stock issues or recent negative feedback.")
            recommendations.append("Action Item: Consider a temporary promotion or check if pricing is competitive compared to others.")

        # Sales spike recommendations
        spikes = [a for a in anomalies if a['type'] == 'spike']
        if spikes:
            recommendations.append("High Demand Alert: Sales surged unexpectedly! Ensure your stock levels can handle this increased volume.")
            
        return recommendations
    
    def get_sales_context_summary(self, anomalies):
        """
        Converts detected anomalies into a text summary for the AI Listing Agent.
        """
        if not anomalies or anomalies.get("status") == "insufficient_data":
            return None
        
        events = anomalies.get("anomalies", [])
        if not events:
            return "Stable sales performance observed."
        
        summary = "Historical Sales Performance Analysis:\n"
        for e in events:
            date_str = e['date'].strftime('%Y-%m-%d')
            type_label = "Sale Surge" if e['type'] == 'spike' else "Low Demand Dip"
            summary += f"- {date_str}: {type_label} with {e['value']} units sold.\n"
        
        return summary
