export function Flap({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className="grid place-items-center w-full"
      style={{
        aspectRatio: "1074/512",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "1fr",
      }}
    >
      <img
        src="/envelope/flap_open.webp"
        className="w-full h-full origin-top duration-500"
        style={{
          gridColumn: "1 / -1",
          gridRow: "1 / -1",
          transform: isOpen ? "rotateX(180deg)" : "rotateX(0deg)",
        }}
        alt="Open flap"
      />
      <img
        src="/envelope/flap_closed.webp"
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

export default function Envelope({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className="w-full relative"
      style={{
        background: `center / contain no-repeat url("/envelope/envelope.webp")`,
        aspectRatio: "1082/656",
      }}
    >
      <div className="w-full absolute top-[2px]">
        <Flap isOpen={isOpen} />
      </div>
    </div>
  );
}
