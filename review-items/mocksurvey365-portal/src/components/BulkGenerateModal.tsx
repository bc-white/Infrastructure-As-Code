import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useModalStore } from "@/store/modalStore";
import type { Shift, ShiftType } from "@/types/schedule";

interface BulkGenerateFormData {
  startDate: Date;
  endDate: Date;
  shiftPattern: {
    name: string;
    startTime: string;
    endTime: string;
    department: string;
    type: ShiftType;
    totalSlots: number;
  }[];
}

interface BulkGenerateModalProps {
  onSave: (shifts: Partial<Shift>[]) => void;
}

const defaultShiftPattern = {
  name: "Morning Shift",
  startTime: "07:00",
  endTime: "15:00",
  department: "ICU",
  type: "Regular" as ShiftType,
  totalSlots: 5,
};

export default function BulkGenerateModal({ onSave }: BulkGenerateModalProps) {
  const { isOpen, mode, setOpen } = useModalStore();
  const [formData, setFormData] = useState<BulkGenerateFormData>({
    startDate: new Date(),
    endDate: new Date(),
    shiftPattern: [{ ...defaultShiftPattern }],
  });

  // Only show this modal for bulk_generate mode
  if (mode !== 'bulk_generate') return null;

  const handleAddPattern = () => {
    setFormData(prev => ({
      ...prev,
      shiftPattern: [...prev.shiftPattern, { ...defaultShiftPattern }],
    }));
  };

  const handleRemovePattern = (index: number) => {
    setFormData(prev => ({
      ...prev,
      shiftPattern: prev.shiftPattern.filter((_, i) => i !== index),
    }));
  };

  const handlePatternChange = (index: number, field: keyof typeof defaultShiftPattern, value: any) => {
    setFormData(prev => ({
      ...prev,
      shiftPattern: prev.shiftPattern.map((pattern, i) => 
        i === index ? { ...pattern, [field]: value } : pattern
      ),
    }));
  };

  const handleSubmit = () => {
    // Generate shifts for each day in the date range
    const shifts: Partial<Shift>[] = [];
    const currentDate = new Date(formData.startDate);
    
    while (currentDate <= formData.endDate) {
      formData.shiftPattern.forEach(pattern => {
        shifts.push({
          name: pattern.name,
          startTime: pattern.startTime,
          endTime: pattern.endTime,
          department: pattern.department,
          type: pattern.type,
          totalSlots: pattern.totalSlots,
          status: 'draft',
          assignedNurses: 0,
          createdAt: new Date(currentDate),
        });
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    onSave(shifts);
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Generate Shifts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, startDate: date }))}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, endDate: date }))}
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Shift Patterns</Label>
              <Button type="button" variant="outline" onClick={handleAddPattern}>
                Add Pattern
              </Button>
            </div>

            {formData.shiftPattern.map((pattern, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shift Name</Label>
                    <Input
                      value={pattern.name}
                      onChange={(e) => handlePatternChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input
                      value={pattern.department}
                      onChange={(e) => handlePatternChange(index, 'department', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={pattern.startTime}
                      onChange={(e) => handlePatternChange(index, 'startTime', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={pattern.endTime}
                      onChange={(e) => handlePatternChange(index, 'endTime', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Shift Type</Label>
                    <Select
                      value={pattern.type}
                      onValueChange={(value) => handlePatternChange(index, 'type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular">Regular</SelectItem>
                        <SelectItem value="Float">Float</SelectItem>
                        <SelectItem value="On-call">On-call</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Required Staff</Label>
                    <Input
                      type="number"
                      min={1}
                      value={pattern.totalSlots}
                      onChange={(e) => handlePatternChange(index, 'totalSlots', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                {formData.shiftPattern.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handleRemovePattern(index)}
                    className="mt-2"
                  >
                    Remove Pattern
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Generate Shifts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 