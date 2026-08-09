import {
  animate,
  createScope,
  createTimeline,
  type Scope,
  spring,
} from "animejs";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import useSound from "use-sound";
import wingSound from "/sfx/wing.m4a?url";

export default function Home() {
  const root = useRef(null);
  const scope = useRef<Scope | null>(null);
  const TEXT_CLASS =
    "col-start-2 text-white font-serif text-7xl text-right mb-10";
  const [isWingFlying, setIsWingFlying] = useState(false);
  const [hoveredMenuItem, setHoverMenuItem] = useState("");
  const navigate = useNavigate();
  const [eagleSound] = useSound(wingSound);

  useEffect(() => {
    scope.current = createScope({ root }).add(() => {
      const tl = createTimeline();
      tl.add("#menu-content", {
        translateY: ["100vh", 0],
        duration: 2000,
        ease: "outSine",
      })
        .label("start")
        .add(
          "#menu-plume",
          {
            y: [-80, 0],
            rotate: ["-7deg", "5deg", 0],
            duration: 1200,
            ease: "inout",
          },
          "start-=1000",
        )
        .add("#menu-title", {
          scale: [0, 1],
          ease: spring({ bounce: 0.4, duration: 350 }),
        })
        .add("#menu-wing", {
          translateY: ["150vh", "-200vh"],
          translateX: ["150vw", "-200vw"],
          duration: 3000,
          ease: "linear",
          onBegin: () => eagleSound(),
        });
      tl.init();
    });
  }, [eagleSound]);

  function goToCredits() {
    animate("#menu-content", {
      translateY: "100vh",
      duration: 2000,
      ease: "outSine",
    }).then(() => {
      navigate("/credits");
    });
  }

  function wingFly() {
    if (!isWingFlying) {
      setIsWingFlying(true);
      eagleSound();
      animate("#menu-wing", {
        translateY: ["150vh", "-200vh"],
        translateX: ["150vw", "-150vh"],
        duration: 3000,
        ease: "linear",
      }).then(() => setIsWingFlying(false));
    }
  }

  return (
    <main
      ref={root}
      className="h-screen w-screen max-h-screen max-w-screen bg-radial from-[#5d3e9e] from-25% to-[#1c2a5e] to-90% overflow-clip"
    >
      <section
        id="menu-content"
        className="size-full relative flex items-stretch"
      >
        <section className="grow relative">
          <img
            src={"/menu/NestGrouped.svg"}
            alt="Nest"
            className="h-[120%] max-w-[120%] absolute left-[-18%] bottom-[-30%]"
          />
          <div className="w-[70%] absolute bottom-[7%] left-[-10%]">
            <div className="w-full max-h-[90vh] max-w-[80vw] aspect-2129/2360 bottom-[7%] left-0 bg-contain bg-no-repeat bg-center bg-[url('/menu/EggNotebook.png')] flex items-center justify-center">
              <img
                id="menu-title"
                alt="Tidying the Eagles' Nest"
                src={"/menu/title-card.svg"}
                className="w-[65%] min-w-[20vw] max-w-[500px] relative left-5"
              />
            </div>
          </div>
          <img
            alt="Stick Pad"
            src={"/menu/StickPad.svg"}
            className="w-[36%] absolute lg:right-[12%] xl:right-[20%] bottom-[12%]"
          />
          <img
            id="menu-plume"
            alt="Plume"
            src={"/menu/Plume.svg"}
            className="w-[60%] max-w-[800px] absolute left-[-8%] bottom-[-5%] origin-[center,-50px]"
          />
        </section>
        <section className="pt-[10%] pr-[5%]">
          <Link
            onMouseOver={() => {
              wingFly();
              setHoverMenuItem("Play");
            }}
            onMouseLeave={() => setHoverMenuItem("")}
            style={{
              opacity:
                hoveredMenuItem === "" || hoveredMenuItem === "Play" ? 1 : 0.5,
            }}
            className="duration-500"
            to="/day/1"
          >
            <p id="menu-play" className={`${TEXT_CLASS}`}>
              Play
            </p>
          </Link>
          <img
            id="menu-wing"
            alt="Wing"
            src={"/menu/Wing.svg"}
            className={`w-[170vw] max-w-none fixed bottom-[-20vh] left-[-80vw] opacity-50 mix-blend-color-burn pointer-events-none`}
          />
          <Link
            to="/levels"
            className="duration-500"
            onMouseOver={() => {
              setHoverMenuItem("Levels");
            }}
            onMouseLeave={() => setHoverMenuItem("")}
            style={{
              opacity:
                hoveredMenuItem === "" || hoveredMenuItem === "Levels"
                  ? 1
                  : 0.5,
            }}
          >
            <p className={TEXT_CLASS}>Levels</p>
          </Link>
          <button
            type="button"
            onClick={goToCredits}
            className="duration-500"
            onMouseOver={() => {
              setHoverMenuItem("Credits");
            }}
            onFocus={() => {
              setHoverMenuItem("Credits");
            }}
            onMouseLeave={() => setHoverMenuItem("")}
            style={{
              opacity:
                hoveredMenuItem === "" || hoveredMenuItem === "Credits"
                  ? 1
                  : 0.5,
            }}
          >
            <p className={TEXT_CLASS}>Credits</p>
          </button>
        </section>
      </section>
    </main>
  );
}
