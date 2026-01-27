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
            recommendations.append("Sales Drop Detected: Check for negative reviews or stock issues.")
            recommendations.append("Consider running a promotion to regain momentum.")

        # Sales spike recommendations
        spikes = [a for a in anomalies if a['type'] == 'spike']
        if spikes:
            recommendations.append("Sales Spike Detected: Ensure stock levels are sufficient for continued demand.")
            
        return recommendations
