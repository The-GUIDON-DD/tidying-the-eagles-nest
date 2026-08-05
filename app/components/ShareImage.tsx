export default function ShareImage({
  bg,
  time,
  width,
}: {
  bg: string;
  time: string;
  width: number | string;
}) {
  return (
    <div
      style={{
        background: `no-repeat center / cover url(${bg})`,
        aspectRatio: "491/1065",
        width: width,
      }}
    >
      <p
        style={{
          fontFamily: "Novel Display XCnd",
          WebkitTextStroke: "10px #442a7c",
          paintOrder: "stroke fill",
          fontSize: 140,
          fontWeight: "bold",
          fontStyle: "italic",
          color: "white",
        }}
      >
        {time}
      </p>
    </div>
  );
}
