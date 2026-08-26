import React, { useEffect, useRef } from "react";
import { Cubes3, Sliders } from "@gravity-ui/icons";
import { SerialPortStatus } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { Avatar, Button, ButtonGroup, Description, Label, ListBox, Modal } from "@heroui/react";
import { useState } from "react";

interface ConnectButtonProps { 
  serialStatus: SerialPortStatus,
  onConnectSerial: (port: string) => void,
  onDisconnectSerial: () => void,
};

export const ConnectButton: React.FC<ConnectButtonProps> = ({ serialStatus, onConnectSerial, onDisconnectSerial }) => {
  const avatars = [
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/blue.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/green.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/purple.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/black.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/red.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/orange.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/white.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/rose.jpg",
    "https://heroui-assets.nyc3.cdn.digitaloceanspaces.com/avatars/indigo.jpg",    
  ];
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const selectedPortRef = useRef(selectedPort);

  useEffect(() => { selectedPortRef.current = selectedPort; }, [selectedPort]);

  const fetchPorts = async () => {
    const result = await invoke("list_ports");
    setPorts(result as string[]);
  };

  const handleOpenModal = () => {
    fetchPorts();
    setIsOpen(true);
  };

  const connect = () => {
    onConnectSerial(selectedPortRef.current);
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={serialStatus.isConnected ? onDisconnectSerial : handleOpenModal}
        isDisabled={!serialStatus.isAvailable && !serialStatus.isConnected}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
          serialStatus.isConnected
            ? 'bg-primary-dark text-primary border border-primary/30'
            : 'bg-surface-border hover:bg-surface-border/80 text-gray-300 border-surface-border'
          }`}
      >
        <Sliders />
        <span>{serialStatus.isConnected ? 'Connected' : 'Connect'}</span>
      </Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
        <Modal.Backdrop>
          <Modal.Container placement="auto">
            <Modal.Dialog className="sm:max-w-md bg-surface-dark">
              <Modal.CloseTrigger className="transition-all font-bold  bg-primary hover:bg-surface-border hover:text-primary text-surface-border" />
              <Modal.Header>
                <Modal.Icon className="bg-primary text-surface-border">
                  <Sliders className="size-5" />
                </Modal.Icon>
                <Modal.Heading>Select COM Port</Modal.Heading>
                <p className="mt-1.5 text-sm leading-5 text-muted">
                  Select the COM port too which the receiver device is connected.
                </p>
              </Modal.Header>
              <Modal.Body className="p-6">
                <ListBox aria-label="COM ports" selectionMode="single" key={ports.join(',')}>
                  {ports.map((port, idx) => (
                    <ListBox.Item
                      className="rounded-lg data-[focused=true]:bg-primary/5 data-[selected=true]:bg-primary/10"
                      key={port}
                      id={port}
                      textValue={port}
                      onClick={() => setSelectedPort(port)}
                    >
                      <Avatar size="sm">
                        <Avatar.Image
                          alt="Bob"
                          src={avatars[idx % avatars.length]}
                        />
                        <Avatar.Fallback>B</Avatar.Fallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Label>{port}</Label>
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Modal.Body>
              <Modal.Footer>
                <ButtonGroup>
                  <Button slot="close" className="transition-all font-bold bg-surface-border text-primary hover:bg-primary hover:text-surface-border">Close</Button>
                  <Button className="transition-all font-bold  bg-primary hover:bg-surface-border hover:text-primary text-surface-border" onClick={connect}>Connect</Button>
                </ButtonGroup>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}