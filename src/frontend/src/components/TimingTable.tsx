"use client";
import { Clock, Tray } from "@gravity-ui/icons";
import { EmptyState, Table } from "@heroui/react";

interface Event {
  sessionId: number;
  timestamp: number;
  timeDiff: number;
  macAddress: string;
  senderAlias: string;
  speed?: number;
}

interface TimingTableProps {
  events: Event[];
}


export const TimingTable: React.FC<TimingTableProps> = ({ events }) => {
  return (
    <Table className="bg-surface-border">
      <Table.ScrollContainer>
        <Table.Content aria-label="Timing Events">
          <Table.Header className="bg-surface-border">
            <Table.Column>Session</Table.Column>
            <Table.Column>Time</Table.Column>
            <Table.Column>Gate</Table.Column>
            <Table.Column>Δ Time</Table.Column>
            <Table.Column>Speed</Table.Column>
          </Table.Header>
          <Table.Body
            className=""
            renderEmptyState={() => (
              <EmptyState className="flex h-full w-full flex-col items-center justify-center gap-4 text-center">
                <Clock className="size-6" />
                <span className="text-sm">No events recorded</span>
              </EmptyState>
            )}
          >
            {events.map((event, index) => (
              <Table.Row key={index} className="">
                <Table.Cell className="bg-surface-dark">Session {event.sessionId}</Table.Cell>
                <Table.Cell className="bg-surface-dark">{event.timestamp}</Table.Cell>
                <Table.Cell className="bg-surface-dark">{event.senderAlias}</Table.Cell>
                <Table.Cell className="bg-surface-dark">{event.timeDiff}</Table.Cell>
                <Table.Cell className="bg-surface-dark">{event.speed}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}