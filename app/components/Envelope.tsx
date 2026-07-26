export function Flap({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className="grid place-items-center w-full"
      style={{
        aspectRatio: "112/52",
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

export default function Envelope({ isOpen }: { isOpen: boolean }) {
  return (
    <div
      className="w-full relative"
      style={{
        background: `center / contain no-repeat url("/envelope/envelope.svg")`,
        aspectRatio: "1072/648",
      }}
    >
      <div className="w-full absolute top-0">
        <Flap isOpen={isOpen} />
      </div>
    </div>
  );
}
