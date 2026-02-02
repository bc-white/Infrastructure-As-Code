import React, { useState } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { 
  FileText, 
  Calendar, 
  Building, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Edit,
  Download
} from 'lucide-react';

const SurveyDataTable = ({ surveys, onView, onEdit, onDownload }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // Calculate pagination
  const totalPages = Math.ceil(surveys.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentSurveys = surveys.slice(startIndex, endIndex);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { variant: 'default', color: 'bg-blue-100 text-blue-800' },
      'completed': { variant: 'secondary', color: 'bg-green-100 text-green-800' },
      'draft': { variant: 'outline', color: 'bg-gray-100 text-gray-800' },
      'reviewing': { variant: 'secondary', color: 'bg-yellow-100 text-yellow-800' },
      'archived': { variant: 'outline', color: 'bg-gray-100 text-gray-600' }
    };

    const config = statusConfig[status] || statusConfig['draft'];
    return (
      <Badge className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'initial':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'annual':
        return <Calendar className="h-4 w-4 text-green-500" />;
      case 'complaint':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'follow-up':
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table */}
      <Card>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Survey</TableHead>
                <TableHead>Facility</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Findings</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentSurveys.length > 0 ? (
                currentSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(survey.type)}
                        <div>
                          <div className="font-medium text-sm">{survey.name}</div>
                          <div className="text-xs text-gray-500">ID: {survey.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{survey.facility}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {survey.type.charAt(0).toUpperCase() + survey.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(survey.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${survey.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{survey.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getSeverityIcon(survey.severity)}
                        <span className="text-sm">{survey.findings || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">{survey.lastUpdated}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(survey)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(survey)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {survey.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(survey)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No surveys found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(endIndex, surveys.length)} of {surveys.length} surveys
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyDataTable;
