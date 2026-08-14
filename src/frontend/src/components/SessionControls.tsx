import React from 'react';
import { Button, ButtonGroup } from '@heroui/react';
import { ArrowRotateLeft, ArrowUpFromSquare, CirclePlus, Flag } from '@gravity-ui/icons';


interface SessionControlsProps {
  onReset: () => void;
  onExport: () => void;
  onManualTrigger: () => void;
  onNewSession: () => void;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  onReset,
  onExport,
  onManualTrigger,
  onNewSession,
}) => {
  return (
    <ButtonGroup>
      <Button
        className="transition-all font-bold  bg-primary hover:bg-surface-new hover:text-primary text-surface-new"
        onClick={onManualTrigger}
      >
        <Flag />Trigger
      </Button>
      <Button
        className="transition-all font-bold bg-surface-new text-primary hover:bg-primary hover:text-surface-new"
        onClick={onNewSession}
      >
        <CirclePlus />New
      </Button>
      <Button
        className="transition-all font-bold bg-surface-new text-primary hover:bg-primary hover:text-surface-new"
        onClick={onReset}
      >
        <ArrowRotateLeft />Reset
      </Button>
      <Button
        className="transition-all font-bold bg-surface-new text-primary hover:bg-primary hover:text-surface-new"
        onClick={onExport}
      >
        <ArrowUpFromSquare />Export
      </Button>
    </ButtonGroup>
  );
};