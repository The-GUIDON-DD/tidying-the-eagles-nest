interface FlapProps {
  isOpen: boolean;
}

export default function Flap({ isOpen }: FlapProps) {
  return (
    <div
      className="grid place-items-center h-full"
      style={{
        aspectRatio: "1072/417",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
      }}
    >
      <img
        src="/envelope/flap_open.svg"
        className="w-full h-full origin-top duration-500"
        style={{
          gridColumn: "1 / -1",
          gridRow: "1 / -1",
          transform: isOpen ? "rotateX(180deg)" : "rotateX(0deg)",
        }}
        alt="Open flap"
      />
      <img
        src="/envelope/flap_closed.svg"
        className="w-full h-full origin-top duration-500"
        style={{
          gridColumn: "1 / -1",
          gridRow: "1 / -1",
          transform: isOpen ? "rotateX(180deg)" : "rotateX(0deg)",
          backfaceVisibility: "hidden",
        }}
        alt="Closed flap"
      />
    </div>
  );
}
