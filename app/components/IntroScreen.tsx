"use client";
// TODO: To be made into a layout?
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useState } from "react";
import Envelope from "./Envelope";

function DroppableSection() {
  // Snapping area for envelope when it is in the "correct position"
  const { ref: dropRef } = useDroppable({
    id: "intro-envelope-drop",
  });

  return (
    <div
      ref={dropRef}
      className="absolute w-[25vw] h-[50vh] top-[25vh] left-[37.5vw] border-amber-100 border-1"
    />
  );
}

function DraggableEnvelope({
  isOpen,
  position,
}: {
  isOpen: boolean;
  position: { x: number; y: number };
}) {
  const { ref: dragRef } = useDraggable({
    id: "intro-envelope-drag",
    modifiers: [RestrictToHorizontalAxis],
  });

  return (
    <div
      ref={dragRef}
      className="w-1/2 absolute top-[20vh] right-[-20vw] duration-150"
      style={{}}
    >
      <div
        style={{
          translate: `${position.x}px ${position.y}px`,
        }}
      >
        <Envelope isOpen={isOpen} />
      </div>
    </div>
  );
}

export default function IntroScreen({ bg = "#bd5d44" }: { bg: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [envelopePos, setPosition] = useState({ x: 0, y: 0 });

  return (
    <DragDropProvider
      onDragEnd={(event) => {
        // This makes the envelope not snap back to its original position
        setPosition({
          x: envelopePos.x + event.operation.transform.x,
          y: envelopePos.y + event.operation.transform.y,
        });
      }}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }), // remove animation when drag ends
      ]}
    >
      <main
        className="h-screen w-screen"
        style={{ background: bg, overflow: "clip" }}
      >
        <p className="absolute top-15 left-2">
          Position: {JSON.stringify(envelopePos)}
        </p>
        <button
          type="button"
          className="absolute top-2 left-2 bg-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          Toggle Open
        </button>
        <DroppableSection />
        <DraggableEnvelope isOpen={isOpen} position={envelopePos} />
      </main>
    </DragDropProvider>
  );
}
