import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Globe, Server, Activity } from 'lucide-react';
import { healthAPI } from '../../../service/api';

const HealthStatus = ({ className = '', showDetails = false }) => {
  const [healthData, setHealthData] = useState({
    status: null,
    ping: null,
    address: null,
    lastChecked: null,
    isLoading: false,
    error: null
  });

  const checkHealth = async () => {
    setHealthData(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [statusResponse, pingResponse, addressResponse] = await Promise.all([
        healthAPI.getStatus(),
        healthAPI.ping(),
        healthAPI.getUserAddress()
      ]);

      setHealthData({
        status: statusResponse,
        ping: pingResponse,
        address: addressResponse,
        lastChecked: new Date(),
        isLoading: false,
        error: null
      });
    } catch (error) {
      setHealthData(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Health check failed'
      }));
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Set up periodic health checks every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (isHealthy) => {
    if (isHealthy) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (isHealthy) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };

  if (healthData.isLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-500 mr-2" />
          <span className="text-gray-600">Checking API health...</span>
        </div>
      </div>
    );
  }

  if (healthData.error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Health Check Failed</h3>
            <p className="text-sm text-red-600">{healthData.error}</p>
          </div>
        </div>
        <button
          onClick={checkHealth}
          className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">API Health Status</h3>
        <button
          onClick={checkHealth}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {/* API Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Server className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">API Status</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(healthData.status?.status === 'up')}
            <span className={`ml-2 text-sm font-medium ${getStatusColor(healthData.status?.status === 'up')}`}>
              {healthData.status?.status || 'Unknown'}
            </span>
          </div>
        </div>

        {/* API Version */}
        {healthData.status?.version && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Version</span>
            <span className="text-sm font-medium text-gray-900">{healthData.status.version}</span>
          </div>
        )}

        {/* Environment */}
        {healthData.status?.env && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Environment</span>
            <span className="text-sm font-medium text-gray-900 capitalize">{healthData.status.env}</span>
          </div>
        )}

        {/* Ping Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Response Time</span>
          </div>
          <div className="flex items-center">
            {getStatusIcon(healthData.ping?.message === 'pong')}
            <span className={`ml-2 text-sm font-medium ${getStatusColor(healthData.ping?.message === 'pong')}`}>
              {healthData.ping?.message === 'pong' ? 'OK' : 'Failed'}
            </span>
          </div>
        </div>

        {/* Last Checked */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Last Checked</span>
          <span className="text-sm font-medium text-gray-900">
            {formatTimestamp(healthData.lastChecked)}
          </span>
        </div>
      </div>

      {/* Detailed Address Information */}
      {showDetails && healthData.address?.data && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
            <Globe className="h-4 w-4 text-gray-500 mr-2" />
            User Location
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">Country:</span>
              <span className="ml-2 font-medium text-gray-900">
                {healthData.address.data.countryName}
              </span>
            </div>
            <div>
              <span className="text-gray-500">State:</span>
              <span className="ml-2 font-medium text-gray-900">
                {healthData.address.data.stateProv}
              </span>
            </div>
            <div>
              <span className="text-gray-500">City:</span>
              <span className="ml-2 font-medium text-gray-900">
                {healthData.address.data.city}
              </span>
            </div>
            <div>
              <span className="text-gray-500">IP:</span>
              <span className="ml-2 font-medium text-gray-900">
                {healthData.address.data.ipAddress}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthStatus; 