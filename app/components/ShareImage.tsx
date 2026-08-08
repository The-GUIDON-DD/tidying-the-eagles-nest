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
        position: "relative",
      }}
    >
      <p
        style={{
          fontFamily: "Novel Display XCnd",
          WebkitTextStroke: "14px #442a7c",
          paintOrder: "stroke fill",
          fontSize: "clamp(5rem, 3vw, 8rem)",
          fontWeight: "bold",
          fontStyle: "italic",
          color: "white",
          position: "absolute",
          top: "37%",
          width: "100%",
          textAlign: "center",
        }}
      >
        {time}
      </p>
    </div>
  );
}
