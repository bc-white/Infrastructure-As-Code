import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import type { ScheduleExportOptions } from "@/types/schedule";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExport: (options: ScheduleExportOptions) => void;
  departments: string[];
}

const ExportModal = ({
  open,
  onClose,
  onExport,
  departments,
}: ExportModalProps) => {
  const [options, setOptions] = useState<ScheduleExportOptions>({
    format: 'pdf',
    dateRange: {
      start: new Date(),
      end: new Date(),
    },
    includeNotes: true,
    departments: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExport(options);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Format</Label>
            <Select
              value={options.format}
              onValueChange={(value: ScheduleExportOptions['format']) =>
                setOptions({ ...options, format: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Calendar
                mode="single"
                selected={options.dateRange.start}
                onSelect={(date) =>
                  date &&
                  setOptions({
                    ...options,
                    dateRange: { ...options.dateRange, start: date },
                  })
                }
                className="rounded-md border"
              />
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Calendar
                mode="single"
                selected={options.dateRange.end}
                onSelect={(date) =>
                  date &&
                  setOptions({
                    ...options,
                    dateRange: { ...options.dateRange, end: date },
                  })
                }
                className="rounded-md border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeNotes"
                checked={options.includeNotes}
                onCheckedChange={(checked) =>
                  setOptions({ ...options, includeNotes: checked as boolean })
                }
              />
              <Label htmlFor="includeNotes">Include shift notes</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Departments</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {departments.map((dept) => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox
                    id={dept}
                    checked={options.departments?.includes(dept)}
                    onCheckedChange={(checked) => {
                      setOptions({
                        ...options,
                        departments: checked
                          ? [...(options.departments || []), dept]
                          : options.departments?.filter((d) => d !== dept),
                      });
                    }}
                  />
                  <Label htmlFor={dept}>{dept}</Label>
                </div>
              ))}
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Export Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal; 