"use client";
// TODO: To be made into a layout?
import { RestrictToHorizontalAxis } from "@dnd-kit/abstract/modifiers";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import { useEffect, useState } from "react";
import useSound from "use-sound";
import dingclick from "/sfx/dingclick.m4a?url";
import dragSfx from "/sfx/paper_drag1_fast.m4a?url";
import Envelope from "./Envelope";

function DroppableSection() {
  // Snapping area for envelope when it is in the "correct position"
  const { ref: dropRef } = useDroppable({
    id: "intro-envelope-drop",
  });

  return (
    <div
      ref={dropRef}
      className="absolute w-[20vw] h-[25vh] top-[37.5vh] left-[40vw]"
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

export default function IntroScreen({
  bg = "#bd5d44",
  onStart,
  children,
}: {
  bg?: string;
  onStart: () => void;
  children: React.ReactNode;
}) {
  const [envelopePos, setPosition] = useState({ x: 0, y: 0 });
  const [isOverSnapArea, setIsOverSnapArea] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [centerPos, setCenterPos] = useState(585);
  const [dingclickSound] = useSound(dingclick);
  const [paperDrag] = useSound(dragSfx);

  useEffect(() => {
    setCenterPos(window.innerWidth * 0.45); // eyeballed value
    return () => {};
  }, []);

  return (
    <main
      className="h-screen w-screen max-h-screen max-w-screen"
      style={{
        background: bg,
        overflowY: "clip",
        overflowX: "clip",
      }}
    >
      <div
        className="size-full"
        style={{
          filter: `blur(${showLetter ? "1rem" : "0rem"})`,
        }}
      >
        <DragDropProvider
          onBeforeDragStart={(event) => {
            if (isOverSnapArea || showLetter) {
              event.preventDefault();
            }
          }}
          onDragStart={(_event) => paperDrag()}
          onDragEnd={(event) => {
            // This makes the envelope not snap back to its original position
            setPosition({
              x: envelopePos.x + event.operation.transform.x,
              y: envelopePos.y + event.operation.transform.y,
            });
            // Snap to center when over drop area
            if (event.operation.target) {
              setPosition({ x: -centerPos, y: 0 });
              dingclickSound();
              setShowLetter(true);
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
            isOpen={showLetter}
            position={envelopePos}
            isOverSnapArea={isOverSnapArea}
          />
        </DragDropProvider>
      </div>
      <article
        className="absolute w-1/2 h-[80vh] left-1/4 duration-500 flex flex-col items-center py-15 px-25 gap-10 text-text-black"
        style={{
          bottom: 0,
          transform: showLetter ? "translateY(0)" : "translateY(80vh)",
          backgroundBlendMode: "overlay, color-burn",
          background:
            "center / cover url('/letter/grain.webp'), linear-gradient(rgba(217,217,217,0), rgba(45,45,45,0.6)), #ffefe0",
        }}
      >
        <h1 className="font-display font-bold text-4xl text-purple">
          Hey there, wanderer!
        </h1>
        {children}
        <button
          type="button"
          onClick={onStart}
          className="flex items-center justify-center bg-purple px-10 py-2 rounded-4xl gap-2"
        >
          <p className="font-display font-bold text-white text-2xl uppercase">
            Start
          </p>
          <img src="/start_arrow.svg" alt="Start Arrow" className="h-[60%]" />
        </button>
      </article>
    </main>
  );
}
