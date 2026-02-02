import React from 'react';
import { Radar, Line, Bar } from 'react-chartjs-2';
import { Card } from '../ui/card';
import { Target, TrendingUp, Award, AlertTriangle } from 'lucide-react';

const BenchmarkComparison = ({ analytics, facilities }) => {
  if (!analytics || !facilities.length) return null;

  // Benchmark data (industry standards)
  const benchmarks = {
    starRating: 3.8,
    occupancy: 85.0,
    rehospitalization: 15.0,
    pressureUlcer: 8.0,
    fallRate: 12.0,
    infectionRate: 3.5,
    satisfaction: 85.0,
    staffingCompliance: 80.0,
    turnoverRate: 45.0
  };

  // Calculate facility averages vs benchmarks
  const facilityAverages = {
    starRating: facilities.reduce((sum, f) => sum + (f.starRating || 3.5), 0) / facilities.length,
    occupancy: facilities.reduce((sum, f) => sum + (f.occupancyRate || 85), 0) / facilities.length,
    rehospitalization: analytics.qualityMetrics.rehospitalizationRate,
    pressureUlcer: analytics.qualityMetrics.pressureUlcerRate,
    fallRate: analytics.qualityMetrics.fallRate,
    infectionRate: analytics.qualityMetrics.infectionRate,
    satisfaction: analytics.experienceMetrics.residentSatisfaction,
    staffingCompliance: analytics.staffingMetrics.staffingCompliance,
    turnoverRate: analytics.staffingMetrics.turnoverRate
  };

  // Radar chart data for performance comparison
  const radarData = {
    labels: [
      'Star Rating',
      'Occupancy',
      'Satisfaction',
      'Staffing',
      'Quality',
      'Compliance'
    ],
    datasets: [
      {
        label: 'Your Facilities',
        data: [
          (facilityAverages.starRating / 5) * 100,
          facilityAverages.occupancy,
          facilityAverages.satisfaction,
          facilityAverages.staffingCompliance,
          100 - facilityAverages.rehospitalization, // Inverted for better visualization
          100 - (facilityAverages.turnoverRate / 2) // Inverted and scaled
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
      },
      {
        label: 'Industry Benchmark',
        data: [
          (benchmarks.starRating / 5) * 100,
          benchmarks.occupancy,
          benchmarks.satisfaction,
          benchmarks.staffingCompliance,
          100 - benchmarks.rehospitalization,
          100 - (benchmarks.turnoverRate / 2)
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.2)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(156, 163, 175, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(156, 163, 175, 1)'
      }
    ]
  };

  // Benchmark comparison data
  const comparisonData = {
    labels: [
      'Star Rating',
      'Occupancy (%)',
      'Rehospitalization (%)',
      'Pressure Ulcers (%)',
      'Falls (%)',
      'Satisfaction (%)',
      'Staffing (%)',
      'Turnover (%)'
    ],
    datasets: [
      {
        label: 'Your Facilities',
        data: [
          facilityAverages.starRating,
          facilityAverages.occupancy,
          facilityAverages.rehospitalization,
          facilityAverages.pressureUlcer,
          facilityAverages.fallRate,
          facilityAverages.satisfaction,
          facilityAverages.staffingCompliance,
          facilityAverages.turnoverRate
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      },
      {
        label: 'Industry Benchmark',
        data: [
          benchmarks.starRating,
          benchmarks.occupancy,
          benchmarks.rehospitalization,
          benchmarks.pressureUlcer,
          benchmarks.fallRate,
          benchmarks.satisfaction,
          benchmarks.staffingCompliance,
          benchmarks.turnoverRate
        ],
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 1
      }
    ]
  };

  // Performance gaps
  const performanceGaps = Object.keys(benchmarks).map(key => ({
    metric: key,
    facility: facilityAverages[key],
    benchmark: benchmarks[key],
    gap: facilityAverages[key] - benchmarks[key],
    performance: facilityAverages[key] > benchmarks[key] ? 'above' : 'below'
  }));

  const radarOptions = {
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
        text: 'Performance vs Industry Benchmark'
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  const comparisonOptions = {
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
        text: 'Detailed Benchmark Comparison'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Radar Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Performance Radar
          </h3>
          <Award className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-80">
          <Radar data={radarData} options={radarOptions} />
        </div>
      </Card>

      {/* Benchmark Comparison Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Detailed Benchmark Analysis
          </h3>
          <AlertTriangle className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-80">
          <Bar data={comparisonData} options={comparisonOptions} />
        </div>
      </Card>

      {/* Performance Gaps Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" />
          Performance Gap Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {performanceGaps.map((gap, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 ${
                gap.performance === 'above'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {gap.metric.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    gap.performance === 'above'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {gap.performance === 'above' ? 'Above' : 'Below'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Facilities:</span>
                  <span className="font-medium">{gap.facility.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Benchmark:</span>
                  <span className="font-medium">{gap.benchmark.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-700">Gap:</span>
                  <span
                    className={
                      gap.performance === 'above' ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {gap.gap > 0 ? '+' : ''}{gap.gap.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default BenchmarkComparison;
