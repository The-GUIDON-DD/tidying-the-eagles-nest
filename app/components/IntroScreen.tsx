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
      className="absolute w-[20vw] h-[25vh] top-[37.5vh] left-[40vw] border-amber-100 border-1"
    />
  );
}

function DraggableEnvelope({
  isOpen,
  position,
  isOverSnapArea,
}: {
  isOpen: boolean;
  position: { x: number; y: number };
  isOverSnapArea: boolean;
}) {
  const { ref: dragRef } = useDraggable({
    id: "intro-envelope-drag",
    modifiers: [RestrictToHorizontalAxis],
  });

  return (
    <div
      ref={dragRef}
      className="w-1/2 absolute top-[25vh] right-[-20vw] duration-150"
      style={{}}
    >
      <div
        style={{
          translate: `${position.x}px ${position.y}px`,
          rotate: isOverSnapArea ? "0deg" : "-12deg",
        }}
      >
        <Envelope isOpen={isOpen} />
      </div>
    </div>
  );
}

export default function IntroScreen({ bg = "#bd5d44" }: { bg: string }) {
  const [envelopePos, setPosition] = useState({ x: 0, y: 0 });
  const [isOverSnapArea, setIsOverSnapArea] = useState(false);

  return (
    <main
      className="h-screen w-screen"
      style={{
        background: bg,
        overflow: "hidden",
      }}
    >
      <div
        className="size-full"
        style={{
          filter: `blur(${isOverSnapArea ? "1rem" : "0rem"})`,
        }}
      >
        <DragDropProvider
          onBeforeDragStart={(event) => {
            if (isOverSnapArea) {
              event.preventDefault();
            }
          }}
          onDragEnd={(event) => {
            // This makes the envelope not snap back to its original position
            setPosition({
              x: envelopePos.x + event.operation.transform.x,
              y: envelopePos.y + event.operation.transform.y,
            });
            // Snap to center when over drop area
            if (event.operation.target) {
              setPosition({ x: -585, y: 0 });
            }
          }}
          onDragMove={(event) => {
            setIsOverSnapArea(!!event.operation.target);
          }}
          plugins={(defaults) => [
            ...defaults,
            Feedback.configure({ dropAnimation: null }), // remove animation when drag ends
          ]}
        >
          <DroppableSection />
          <DraggableEnvelope
            isOpen={isOverSnapArea}
            position={envelopePos}
            isOverSnapArea={isOverSnapArea}
          />
        </DragDropProvider>
      </div>
      <article
        className="absolute w-1/2 h-[70vh] left-1/4 duration-500 flex flex-col items-center py-10 px-15"
        style={{
          bottom: isOverSnapArea ? 0 : "-70vh",
          backgroundBlendMode: "overlay, color-burn",
          background:
            "center / cover url('/letter/grain.svg'), linear-gradient(rgba(217,217,217,0), rgba(45,45,45,0.6)), #ffefe0",
        }}
      >
        <h1 className="font-display font-bold">Hey there, wanderer!</h1>
        <p>
          Before you know it, you'll be entering the Dreamlands. Organize these
          items in your satchel to ensure that you have everything you need for
          your first day.
        </p>
      </article>
    </main>
  );
}
