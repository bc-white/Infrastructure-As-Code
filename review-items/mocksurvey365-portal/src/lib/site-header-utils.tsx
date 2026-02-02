import React from "react";
import { Button } from "../components/ui/button";
import { useModalStore } from "@/store/modalStore";

export interface HeaderActionTypes {
  pathname: string;
  onExport?: () => void;
  onAddUnit?: () => void;
  onAddEmployee?: () => void;
}

export function getHeaderActions(props: HeaderActionTypes): React.ReactNode {
  const { pathname, onAddUnit } = props;
  const { setOpen, setMode, setData } = useModalStore();

  if (!pathname) return null;



  if (pathname.startsWith("/dashboard/schedule-management")) {
    return (
      <div className="w-full sm:w-auto">
        <Button 
          styleType="primary" 
          size="default" 
          className="w-full sm:w-auto" 
          onClick={() => {
            setMode('create_schedule');
            setData(undefined);
            setOpen(true);
          }}
        >
          Create New Schedule
        </Button>
      </div>
    );
  }

  if (pathname.startsWith("/dashboard/unit-management")) {
    return (
      <div className="w-full sm:w-auto">
        <Button styleType="primary" size="default" className="w-full sm:w-auto" onClick={onAddUnit}>Add Unit</Button>
      </div>
    );
  }

  return null;
} 