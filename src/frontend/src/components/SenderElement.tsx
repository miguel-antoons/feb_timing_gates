import { useSortable } from '@dnd-kit/react/sortable';
import React, { useState, useRef } from 'react';
import { Button, ButtonGroup, Input, Label, Modal, Surface, TextField } from "@heroui/react";
import { PencilToLine, BroadcastSignal, Dots9, Envelope } from '@gravity-ui/icons';
import { Sender } from '../types';

interface SenderProps {
  id: number;
  index: number;
  onUpdateAlias: (senderId: number, newAlias: string) => void;
  onUpdateDistance: (senderId: number, distance: number) => void;
  sender: Sender;
}


export const SenderElement: React.FC<SenderProps> = ({id, index, onUpdateAlias, onUpdateDistance, sender}) => {
  const [element, setElement] = useState<Element | null>(null);
    const handleRef = useRef<HTMLButtonElement | null>(null);
    const {isDragging} = useSortable({id, index, element, handle: handleRef});
  return (
    <div ref={setElement} className="flex items-center bg-surface-dark rounded-xl item" data-shadow={isDragging || undefined}>
      <Button isIconOnly ref={handleRef} className="handle"><Dots9 /></Button>
      <div className="flex-1 px-2 min-w-0">
        <div className="truncate">
          <span>{sender.alias}</span><br />
          <span className="truncate block text-gray-500 text-xs italic">{sender.macAddress} - {sender.distanceToNext} m</span>
        </div>
      </div>
      <div className="ml-auto pr-2">
        <ButtonGroup>
          <Button isIconOnly className="transition-all font-bold bg-surface-border text-primary hover:bg-primary hover:text-surface-border" onClick={() => console.log(`Clicked sender ${id}`)}><BroadcastSignal /></Button>
          <Modal>
            <Button isIconOnly className="transition-all font-bold  bg-primary hover:bg-surface-border hover:text-primary text-surface-border" onClick={() => console.log(`Clicked sender ${id}`)}><PencilToLine /></Button>
            <Modal.Backdrop>
              <Modal.Container placement="auto">
                <Modal.Dialog className="sm:max-w-md bg-surface-dark">
                  <Modal.CloseTrigger className="transition-all font-bold  bg-primary hover:bg-surface-border hover:text-primary text-surface-border" />
                  <Modal.Header>
                    <Modal.Icon className="bg-primary text-surface-border">
                      <PencilToLine className="size-5" />
                    </Modal.Icon>
                    <Modal.Heading>Edit Gate {sender.macAddress}</Modal.Heading>
                    <p className="mt-1.5 text-sm leading-5 text-muted">
                      Edit the alias and the distance to the previous gate for this gate.
                      If this is the first gate, the distance to the previous gate will be the distance from the last gate.
                    </p>
                  </Modal.Header>
                  <Modal.Body className="p-6">
                    <Surface variant="default">
                      <form className="flex flex-col gap-4 bg-surface-dark">
                        <TextField className="w-full bg-surface-dark" name="alias" type="text" variant="secondary">
                          <Label>Alias</Label>
                          <Input className="green-primary-input bg-surface-border" placeholder="Enter an Alias" value={sender.alias} onChange={(e) => onUpdateAlias(id, e.target.value)} />
                        </TextField>
                        <TextField className="w-full bg-surface-dark" name="distanceToPrevious" type="number" variant="secondary">
                          <Label>Distance to Previous Gate (m)</Label>
                          <Input className="green-primary-input bg-surface-border" type="number" min="0" placeholder="Enter the Distance in Meters" value={sender.distanceToNext} onChange={(e) => onUpdateDistance(id, Number(e.target.value))} />
                        </TextField>
                      </form>
                    </Surface>
                  </Modal.Body>
                  <Modal.Footer>
                    <Button slot="close" className="transition-all font-bold  bg-primary hover:bg-surface-border hover:text-primary text-surface-border">Done</Button>
                  </Modal.Footer>
                </Modal.Dialog>
              </Modal.Container>
            </Modal.Backdrop>
          </Modal>
        </ButtonGroup>
      </div>
    </div>
  )
}