"use client";
import { Moon } from "@gravity-ui/icons";
import { EmptyState, Table } from "@heroui/react";
import { TimingEvent } from "../types";


interface TimingTableProps {
  events: TimingEvent[];
  calculateTimeDiff: (events: TimingEvent[], index: number) => number;
  calculateSpeed: (events: TimingEvent[], index: number) => number;
}


export const TimingTable: React.FC<TimingTableProps> = ({ events, calculateTimeDiff, calculateSpeed }) => {
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(Math.floor(timestamp));
    const ms = timestamp % 1000;
    const timeString = date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    return timeString + '.' + ms.toString().padStart(3, '0');
  };
  
  // Format time difference
  const formatTimeDiff = (events: TimingEvent[], index: number) => {
    const timeDiff = calculateTimeDiff(events, index);
    if (timeDiff === 0) return '-';
    return (timeDiff / 1000).toFixed(3) + 's';
  };

  const formatSpeed = (events: TimingEvent[], index: number) => {
    const speed = calculateSpeed(events, index);
    if (speed === undefined || speed === 0) return '-';
    return speed + ' kph';
  }
  
  return (
    <Table className="bg-surface-border">
      <Table.ScrollContainer>
        <Table.Content aria-label="Timing Events">
          <Table.Header className="bg-surface-border">
            <Table.Column isRowHeader>Session</Table.Column>
            <Table.Column>Gate</Table.Column>
            <Table.Column>Time</Table.Column>
            <Table.Column>Δ Time</Table.Column>
            <Table.Column>Speed</Table.Column>
          </Table.Header>
          <Table.Body
            className=""
            renderEmptyState={() => (
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                <Moon className="size-6" />
                <span className="text-sm">No events recorded</span>
              </EmptyState>
            )}
          >
            {events.map((event, index) => (
              <Table.Row key={index}>
                <Table.Cell className={event.sessionId % 2 ? "bg-surface-dark" : "bg-surface-new"}>Session {event.sessionId}</Table.Cell>
                <Table.Cell className={event.sessionId % 2 ? "bg-surface-dark" : "bg-surface-new"}>{event.senderAlias}</Table.Cell>
                <Table.Cell className={event.sessionId % 2 ? "bg-surface-dark" : "bg-surface-new"}>{formatTimestamp(event.timestamp)}</Table.Cell>
                <Table.Cell className={event.sessionId % 2 ? "bg-surface-dark" : "bg-surface-new"}>{formatTimeDiff(events, index)}</Table.Cell>
                <Table.Cell className={event.sessionId % 2 ? "bg-surface-dark" : "bg-surface-new"}>{formatSpeed(events, index)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}