import React from "react";
import { Button } from "../../ui/button";

const MDSModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            MDS Assessment Data
          </h3>
          <Button
            onClick={onClose}
            variant="outline"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ✕
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                Cognition & Communication
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">BIMS Score:</span>
                  <span className="font-medium">15/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPS Score:</span>
                  <span className="font-medium">0 (Intact)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Communication:</span>
                  <span className="font-medium">Understood</span>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">
                ADL Function
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bed Mobility:</span>
                  <span className="font-medium">Independent</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer:</span>
                  <span className="font-medium">Supervision</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Toilet Use:</span>
                  <span className="font-medium">Limited Assistance</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">
              Clinical Indicators
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong className="text-gray-700">Pressure Ulcers:</strong>
                <div className="text-gray-600">Stage 2 on sacrum</div>
              </div>
              <div>
                <strong className="text-gray-700">Weight Change:</strong>
                <div className="text-gray-600">-3.2% in 30 days</div>
              </div>
              <div>
                <strong className="text-gray-700">Medications:</strong>
                <div className="text-gray-600">12 medications</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MDSModal;
