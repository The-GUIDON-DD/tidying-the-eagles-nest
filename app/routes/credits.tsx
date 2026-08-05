import { createTimeline } from "animejs";
import { useEffect } from "react";

export default function Credits() {
  useEffect(() => {
    const tl = createTimeline();
    tl.add("#credits-cont", {
      translateY: ["100vh", 0],
      duration: 2000,
      ease: "outSine",
    })
      .label("start")
      .add(
        "#plume-blue",
        {
          y: [-30, -10],
          rotate: ["-7deg", "5deg", 0],
          duration: 2000,
          ease: "inout",
        },
        "start-=1500",
      )
      .add(
        "#plume-magenta",
        {
          y: [-30, -10],
          rotate: ["-7deg", "5deg", 0],
          duration: 2000,
          ease: "inout",
        },
        "start-=1300",
      )
      .add(
        "#envelope",
        {
          y: [-20, 0],
          rotate: [-8, 0],
          duration: 1500,
          ease: "inout",
        },
        "start-=1300",
      )
      .add(
        "#paper-front",
        {
          y: [-20, 0],
          rotate: [-3, 0],
          duration: "2000",
          ease: "inout",
        },
        "start-=1300",
      )
      .add(
        "#paper-back",
        {
          y: [-20, 0],
          rotate: [2, 0],
          duration: "2000",
          ease: "inout",
        },
        "start-=1400",
      )
      .add(
        "#stamp",
        {
          scale: [0, 1],
          duration: 500,
          ease: "outBounce",
        },
        "<",
      );

    tl.init();
  }, []);

  const PAPER_CLASS =
    "aspect-3247/2794 w-[70vw] bg-linear-to-b from-[rgba(217,217,217,0.6)] to-[rgba(45,45,45,0.6)] bg-[#ffefe0] bg-blend-color-burn fixed pt-25 pb-15 px-10 min-w-[900px]";
  const TEXT_CLASS =
    "text-[#595959] text-3xl leading-[1.5em] font-serif-upright w-full text-center";
  return (
    <main className="h-screen w-screen max-h-screen max-w-screen bg-radial from-purple from-25% to-deep-blue to-90% overflow-clip">
      <div id="credits-cont" className="size-full fixed inset-0">
        <img
          alt="Envelope"
          id="envelope"
          src={"/Envelope.svg"}
          className="fixed left-0 bottom-[-15vh] rotate-14 w-[80vw]"
        />
        <img
          alt="Magenta Plume"
          id="plume-magenta"
          src={"/magenta-plume.svg"}
          className="fixed left-[-9vw] bottom-[-15vh] w-[30vw]"
        />
        <div
          id="paper-back"
          className={`${PAPER_CLASS} bottom-[-13vh] right-0 -rotate-9 brightness-93`}
        />
        <div
          id="paper-front"
          className={`${PAPER_CLASS} bottom-[-12vh] right-0 -rotate-15`}
        >
          <h1 className="text-purple uppercase text-8xl font-bold font-display w-full text-center mb-20">
            Credits
          </h1>
          <section className="mb-4">
            <h2 className={`${TEXT_CLASS} font-black`}>Designed by</h2>
            <p className={`${TEXT_CLASS}`}>
              <strong>Althea Dela Vega</strong>,&nbsp;<strong>Pb Chua</strong>
              ,&nbsp;<strong>Abby Montayre</strong>,&nbsp;and{" "}
              <strong>Helena Leaño</strong>
            </p>
          </section>
          <section>
            <h2 className={`${TEXT_CLASS} font-black`}>Developed by</h2>
            <p className={`${TEXT_CLASS}`}>
              <strong>Charles Joshua T. Uy</strong>,&nbsp;
              <strong>Cheska Huang</strong>,&nbsp;and{" "}
              <strong>Neil Biason</strong>
            </p>
          </section>
          <section className="relative top-15 px-4 w-full flex justify-end">
            <img
              alt="Stamp"
              id="stamp"
              src="/stamp.svg"
              className="h-[20vh] rotate-20"
            />
          </section>
        </div>
        <img
          id="plume-blue"
          alt="Blue Plume"
          src={"/blue-plume.svg"}
          className="fixed left-[3vw] bottom-[-1vh] w-[35vw]"
        />
      </div>
    </main>
  );
}
