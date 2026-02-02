import React from 'react';
import { Scatter, Line } from 'react-chartjs-2';
import { Card } from '../ui/card';
import { Shield, AlertTriangle, TrendingUp, Activity, Thermometer, CheckCircle } from 'lucide-react';

const RiskAnalysis = ({ analytics, facilities }) => {
  if (!analytics || !facilities.length) return null;

  // Generate scatter plot data for staffing vs quality correlation
  const staffingQualityData = {
    datasets: [
      {
        label: 'Facilities',
        data: facilities.map(facility => ({
          x: facility.rnHprd || 0.8,
          y: facility.rehospitalizationRate || 15.2
        })),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Risk trend data (simulated monthly data)
  const riskTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'High Risk Facilities',
        data: [8, 6, 7, 5, 4, 3, 2, 3, 4, 5, 6, 4],
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Medium Risk Facilities',
        data: [12, 14, 13, 15, 16, 18, 20, 18, 16, 15, 14, 16],
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Low Risk Facilities',
        data: [15, 15, 15, 15, 15, 14, 13, 14, 15, 15, 15, 15],
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Heatmap data for risk factors
  const riskFactors = [
    { name: 'Rehospitalization', value: analytics.qualityMetrics.rehospitalizationRate, threshold: 15.0, risk: 'high' },
    { name: 'Pressure Ulcers', value: analytics.qualityMetrics.pressureUlcerRate, threshold: 8.0, risk: 'high' },
    { name: 'Falls', value: analytics.qualityMetrics.fallRate, threshold: 12.0, risk: 'high' },
    { name: 'Infections', value: analytics.qualityMetrics.infectionRate, threshold: 3.5, risk: 'high' },
    { name: 'Staffing Turnover', value: analytics.staffingMetrics.turnoverRate, threshold: 45.0, risk: 'high' },
    { name: 'Deficiencies', value: analytics.complianceMetrics.deficiencyCount / facilities.length, threshold: 8.0, risk: 'high' },
    { name: 'Satisfaction', value: analytics.experienceMetrics.residentSatisfaction, threshold: 85.0, risk: 'low' },
    { name: 'Occupancy', value: analytics.operationalMetrics.avgOccupancy, threshold: 85.0, risk: 'low' }
  ];

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Staffing vs Quality Correlation'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `RN HPRD: ${context.parsed.x.toFixed(1)}, Rehospitalization: ${context.parsed.y.toFixed(1)}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'RN Hours Per Resident Day'
        },
        beginAtZero: true
      },
      y: {
        title: {
          display: true,
          text: 'Rehospitalization Rate (%)'
        },
        beginAtZero: true
      }
    }
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20
        }
      },
      title: {
        display: true,
        text: 'Risk Trend Analysis (12 Months)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Facilities'
        }
      }
    }
  };

  const getRiskColor = (value, threshold, riskType) => {
    const isHighRisk = riskType === 'high' ? value > threshold : value < threshold;
    if (isHighRisk) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (riskType === 'high' ? value > threshold * 0.8 : value < threshold * 1.2) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getRiskIcon = (value, threshold, riskType) => {
    const isHighRisk = riskType === 'high' ? value > threshold : value < threshold;
    return isHighRisk ? AlertTriangle : CheckCircle;
  };

  return (
    <div className="space-y-6">
      {/* Risk Trend Analysis */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Risk Trend Analysis
          </h3>
          <Activity className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="h-80">
          <Line data={riskTrendData} options={trendOptions} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staffing vs Quality Correlation */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Staffing vs Quality Correlation
            </h3>
            <Thermometer className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="h-80">
            <Scatter data={staffingQualityData} options={scatterOptions} />
          </div>
        </Card>

        {/* Risk Factors Heatmap */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Factors Assessment
            </h3>
            <Shield className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {riskFactors.map((factor, index) => {
              const RiskIcon = getRiskIcon(factor.value, factor.threshold, factor.risk);
              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${getRiskColor(factor.value, factor.threshold, factor.risk)}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RiskIcon className="w-4 h-4" />
                      <span className="font-medium">{factor.name}</span>
                    </div>
                    <span className="text-sm font-bold">
                      {factor.value.toFixed(1)}
                      {factor.name === 'Occupancy' || factor.name === 'Satisfaction' ? '%' : ''}
                    </span>
                  </div>
                  <div className="text-xs opacity-75">
                    Threshold: {factor.threshold}
                    {factor.name === 'Occupancy' || factor.name === 'Satisfaction' ? '%' : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-red-900">High Risk</h4>
              <p className="text-sm text-red-700">Immediate attention needed</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-red-600 mb-2">
            {analytics.riskAssessment.highRisk}
          </div>
          <div className="text-sm text-red-700">
            {((analytics.riskAssessment.highRisk / facilities.length) * 100).toFixed(1)}% of facilities
          </div>
        </Card>

        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Activity className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-yellow-900">Medium Risk</h4>
              <p className="text-sm text-yellow-700">Monitor closely</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-yellow-600 mb-2">
            {analytics.riskAssessment.mediumRisk}
          </div>
          <div className="text-sm text-yellow-700">
            {((analytics.riskAssessment.mediumRisk / facilities.length) * 100).toFixed(1)}% of facilities
          </div>
        </Card>

        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-green-900">Low Risk</h4>
              <p className="text-sm text-green-700">Performing well</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {analytics.riskAssessment.lowRisk}
          </div>
          <div className="text-sm text-green-700">
            {((analytics.riskAssessment.lowRisk / facilities.length) * 100).toFixed(1)}% of facilities
          </div>
        </Card>
      </div>
    </div>
  );
};

export default RiskAnalysis;
