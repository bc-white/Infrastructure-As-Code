import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { useModalStore } from "@/store/modalStore";

interface ScheduleForm {
  name: string;
  startDate: Date;
  endDate: Date;
  department: string;
  notes?: string;
  id?: string;
}

interface ScheduleModalProps {
  onSave: (schedule: ScheduleForm) => void;
}

export default function ScheduleModal({ onSave }: ScheduleModalProps) {
  const { isOpen, mode, data, setOpen } = useModalStore();
  const [formData, setFormData] = useState<ScheduleForm>({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    department: '',
    notes: '',
  });

  useEffect(() => {
    if (data && isOpen) {
      // Populate form with existing data for editing
      setFormData({
        name: data.name || '',
        startDate: data.startDate || new Date(),
        endDate: data.endDate || new Date(),
        department: data.department || '',
        notes: data.notes || '',
        id: data.id,
      });
    } else if (isOpen && !data) {
      // Reset form for new schedule
      setFormData({
        name: '',
        startDate: new Date(),
        endDate: new Date(),
        department: '',
        notes: '',
      });
    }
  }, [data, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setOpen(false);
  };

  // Only show this modal for create_schedule mode
  if (mode !== 'create_schedule') return null;

  const isEditing = !!formData.id;

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Schedule' : 'Create New Schedule'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Schedule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Week 32 Schedule"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={(date) => date && setFormData({ ...formData, startDate: date })}
                className="rounded-md border"
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Calendar
                mode="single"
                selected={formData.endDate}
                onSelect={(date) => date && setFormData({ ...formData, endDate: date })}
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="e.g., Customer Support, ICU"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {isEditing ? 'Update Schedule' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 