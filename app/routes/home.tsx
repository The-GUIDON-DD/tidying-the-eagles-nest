import {
  createScope,
  createTimeline,
  cubicBezier,
  type Scope,
  utils,
} from "animejs";
import { useEffect, useRef } from "react";

export default function Home() {
  const root = useRef(null);
  const scope = useRef<Scope | null>(null);
  const TEXT_CLASS = "col-start-2 text-white font-serif text-7xl text-right";

  useEffect(() => {
    scope.current = createScope({ root }).add((self) => {
      const tl = createTimeline();
      tl.label("start")
        .add("#menu-container", {
          bottom: ["-300vh", "0vh"],
          duration: 2000,
          ease: cubicBezier(0.1, 0.7, 0.5, 1),
        })
        .label("enternest")
        .add("#title-card", {
          scale: [0, 1],
          duration: 750,
          ease: "outElastic(1,0.5)",
        })
        .add("#wing", {
          translateX: ["200vw", "-200vw"],
          translateY: ["200vh", "-200vh"],
          duration: 3500,
          ease: "linear",
        })
        .add(
          "#plume",
          {
            y: [-50, 0],
            duration: 1200,
            rotate: ["-5deg", "5deg", "0deg"],
            ease: "inOut",
          },
          "enternest-=1000",
        );

      tl.init();
    });

    return () => scope.current?.revert();
  }, []);

  return (
    <main
      ref={root}
      className="h-screen w-screen max-h-screen max-w-screen bg-radial from-[#5d3e9e] from-25% to-[#1c2a5e] to-90% overflow-clip z-5"
    >
      <div
        id="menu-container"
        className="w-full h-full overflow-clip grid grid-cols-[4fr_fit-content(75ch)] gap-y-12 grid-rows-[3em_3em_3em_3em_1fr] pt-20 pr-20 fixed z-0"
      >
        <div className="size-full col-start-1 col-span-1 row-span-5 relative">
          <img
            id="nest"
            src={"/menu/NestGrouped.svg"}
            alt="Nest"
            className="w-[85vw] max-w-none absolute left-[-10vw] bottom-[-30vh]"
          />
          <img
            id="title-card"
            src={"/menu/title-card.svg"}
            alt="Title Card"
            className="w-[28vw] max-w-none absolute left-[11vw] bottom-[40vh]"
          />
          <img
            id="plume"
            src={"/menu/Plume.svg"}
            alt="Plume"
            className="w-[40vw] max-w-none absolute left-[5vw] bottom-0 origin-[center_-30px]"
          />
          <img
            id="wing"
            src={"/menu/Wing.svg"}
            alt="Wing"
            className="w-[150vw] max-w-none absolute left-[-100vw] bottom-0 mix-blend-multiply z-0 opacity-50"
          />
        </div>
        <p className={TEXT_CLASS}>Play</p>
        <p className={TEXT_CLASS}>Levels</p>
        <p className={TEXT_CLASS}>How to Play</p>
        <p className={TEXT_CLASS}>Credits</p>
      </div>
    </main>
  );
}
