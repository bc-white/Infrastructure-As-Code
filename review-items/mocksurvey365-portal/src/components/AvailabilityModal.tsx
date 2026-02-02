import React, { useState } from "react";
import { Calendar, Clock, Save, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Employee } from "@/store/employee";
import { useNotification } from "@/contexts/NotificationContext";

interface AvailabilityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
}

interface DayAvailability {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}

interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

const defaultDayAvailability: DayAvailability = {
  isAvailable: true,
  startTime: "09:00",
  endTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
};

const timeOptions = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", "09:00", "09:30",
  "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00"
];

export const AvailabilityModal: React.FC<AvailabilityModalProps> = ({
  open,
  onOpenChange,
  employee,
}) => {
  const { showToast } = useNotification();
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<WeeklyAvailability>({
    monday: { ...defaultDayAvailability },
    tuesday: { ...defaultDayAvailability },
    wednesday: { ...defaultDayAvailability },
    thursday: { ...defaultDayAvailability },
    friday: { ...defaultDayAvailability },
    saturday: { isAvailable: false, startTime: "09:00", endTime: "17:00" },
    sunday: { isAvailable: false, startTime: "09:00", endTime: "17:00" },
  });

  const [preferences, setPreferences] = useState({
    maxHoursPerWeek: "40",
    preferredShifts: "day",
    overtimeAvailable: true,
    onCallAvailable: false,
    weekendAvailable: false,
  });

  const dayNames = {
    monday: "Monday",
    tuesday: "Tuesday", 
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const handleDayToggle = (day: keyof WeeklyAvailability) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable,
      },
    }));
  };

  const handleTimeChange = (
    day: keyof WeeklyAvailability,
    field: keyof DayAvailability,
    value: string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handlePreferenceChange = (field: string, value: string | boolean) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetToDefault = () => {
    setAvailability({
      monday: { ...defaultDayAvailability },
      tuesday: { ...defaultDayAvailability },
      wednesday: { ...defaultDayAvailability },
      thursday: { ...defaultDayAvailability },
      friday: { ...defaultDayAvailability },
      saturday: { isAvailable: false, startTime: "09:00", endTime: "17:00" },
      sunday: { isAvailable: false, startTime: "09:00", endTime: "17:00" },
    });
    setPreferences({
      maxHoursPerWeek: "40",
      preferredShifts: "day",
      overtimeAvailable: true,
      onCallAvailable: false,
      weekendAvailable: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      console.log("Availability updated:", {
        employee: employee?.id,
        availability,
        preferences,
      });
      
      onOpenChange(false);
      showToast(
        "Success",
        "Availability updated successfully!",
        "default"
      );
    } catch (error) {
      showToast(
        "Error",
        "Error updating availability. Please try again.",
        "default"
      );
    } finally {
      setLoading(false);
    }
  };

  const getTotalHours = () => {
    let totalHours = 0;
    Object.values(availability).forEach(day => {
      if (day.isAvailable) {
        const start = new Date(`2000-01-01T${day.startTime}`);
        const end = new Date(`2000-01-01T${day.endTime}`);
        const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        // Subtract break time if specified
        if (day.breakStart && day.breakEnd) {
          const breakStart = new Date(`2000-01-01T${day.breakStart}`);
          const breakEnd = new Date(`2000-01-01T${day.breakEnd}`);
          const breakDiff = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
          totalHours += Math.max(0, diff - breakDiff);
        } else {
          totalHours += Math.max(0, diff);
        }
      }
    });
    return totalHours.toFixed(1);
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-indigo-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Update Availability
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                Set working hours and preferences for {employee.firstName} {employee.lastName}
              </DialogDescription>
            </div>
            <div className="text-right">
              <div className="font-medium text-gray-900">Weekly Total</div>
              <div className="text-2xl font-bold text-indigo-600">{getTotalHours()}h</div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={20} />
                    Weekly Schedule
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    styleType="ghost"
                    size="sm"
                    onClick={resetToDefault}
                    className="gap-2"
                  >
                    <RotateCcw size={16} />
                    Reset to Default
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(availability).map(([day, dayData]) => (
                  <div key={day} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={day}
                          checked={dayData.isAvailable}
                          onChange={() => handleDayToggle(day as keyof WeeklyAvailability)}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor={day} className="text-sm font-medium text-gray-900">
                          {dayNames[day as keyof typeof dayNames]}
                        </label>
                      </div>
                      <Badge variant={dayData.isAvailable ? "success" : "secondary"}>
                        {dayData.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </div>
                    
                    {dayData.isAvailable && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <FormField label="Start Time">
                          <Select
                            value={dayData.startTime}
                            onValueChange={(value) => handleTimeChange(day as keyof WeeklyAvailability, "startTime", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        
                        <FormField label="End Time">
                          <Select
                            value={dayData.endTime}
                            onValueChange={(value) => handleTimeChange(day as keyof WeeklyAvailability, "endTime", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        
                        <FormField label="Break Start">
                          <Select
                            value={dayData.breakStart || "no-break"}
                            onValueChange={(value) => handleTimeChange(day as keyof WeeklyAvailability, "breakStart", value === "no-break" ? "" : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-break">No Break</SelectItem>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        
                        <FormField label="Break End">
                          <Select
                            value={dayData.breakEnd || "no-break"}
                            onValueChange={(value) => handleTimeChange(day as keyof WeeklyAvailability, "breakEnd", value === "no-break" ? "" : value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="no-break">No Break</SelectItem>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Work Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Work Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="Maximum Hours per Week">
                    <Select
                      value={preferences.maxHoursPerWeek}
                      onValueChange={(value) => handlePreferenceChange("maxHoursPerWeek", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="20">20 hours</SelectItem>
                        <SelectItem value="30">30 hours</SelectItem>
                        <SelectItem value="40">40 hours</SelectItem>
                        <SelectItem value="50">50 hours</SelectItem>
                        <SelectItem value="60">60 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>

                  <FormField label="Preferred Shift Type">
                    <Select
                      value={preferences.preferredShifts}
                      onValueChange={(value) => handlePreferenceChange("preferredShifts", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift (6AM - 6PM)</SelectItem>
                        <SelectItem value="evening">Evening Shift (2PM - 10PM)</SelectItem>
                        <SelectItem value="night">Night Shift (10PM - 6AM)</SelectItem>
                        <SelectItem value="rotating">Rotating Shifts</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormField>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="overtime"
                      checked={preferences.overtimeAvailable}
                      onChange={(e) => handlePreferenceChange("overtimeAvailable", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="overtime" className="text-sm font-medium text-gray-900">
                      Available for overtime work
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="oncall"
                      checked={preferences.onCallAvailable}
                      onChange={(e) => handlePreferenceChange("onCallAvailable", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="oncall" className="text-sm font-medium text-gray-900">
                      Available for on-call duties
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="weekend"
                      checked={preferences.weekendAvailable}
                      onChange={(e) => handlePreferenceChange("weekendAvailable", e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="weekend" className="text-sm font-medium text-gray-900">
                      Available for weekend work
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                styleType="stroke"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto sm:flex-1 gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving Availability...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Availability
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AvailabilityModal; 