import { animate, createTimeline } from "animejs";
import dayjs from "dayjs";
import { useEffect } from "react";
import { Link } from "react-router";
import styles from "../styles/levels.module.css";

function LevelIcon({
  link,
  id,
  icon,
  name,
  bgColor,
  isLocked,
}: {
  link: string;
  id: string;
  icon: string;
  name: string;
  bgColor: string;
  isLocked: boolean;
}) {
  function shake() {
    animate(`#levels-${id}-lock-img`, {
      rotate: [-8, 8, -6.5, 6.5, -4.5, 0],
      duration: 360,
      ease: "inOutSine",
    });
  }
  return (
    <Link to={!isLocked ? link : ""}>
      <article
        id={`levels-${id}-icon`}
        style={{ backgroundColor: bgColor, zIndex: id === "day2" ? 50 : 0 }}
        className={`aspect-square grow border-10 border-rich-black flex items-center justify-center p-[15%] relative`}
      >
        <img
          src={icon}
          alt={name}
          className="w-full h-full max-w-full max-h-full"
        />
        {/* locked layer */}
        {isLocked && (
          <div
            role="none"
            onMouseEnter={shake} // biome-ignore lint: for presentation purposes only
            className={`${styles.levelsLock} size-full absolute inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center`}
          >
            <div
              id={`levels-${id}-lock-img-cont`}
              className={`${styles.levelsLockHover} w-[20%]`}
            >
              <img
                id={`levels-${id}-lock-img`}
                src="/levels/lock.svg"
                alt="Locked"
                className="w-full"
              />
            </div>
          </div>
        )}
      </article>
    </Link>
  );
}
export default function LevelsScreen() {
  const levels = [
    {
      name: "Day 1",
      id: "day1",
      icon: "/levels/day1.svg",
      link: "/level/day/1",
      bgColor: "var(--color-bright-yellow)",
      unlockDate: dayjs("August 3, 2026"),
    },
    {
      name: "Day 2",
      id: "day2",
      icon: "/levels/day2.svg",
      link: "/level/day/2",
      bgColor: "var(--color-pale-yellow)",
      unlockDate: dayjs("August 4, 2026"),
    },
    {
      name: "Day 3",
      id: "day3",
      icon: "/levels/day3.svg",
      link: "/level/day/3",
      bgColor: "var(--color-deep-blue)",
      unlockDate: dayjs("August 5, 2026"),
    },
  ];

  useEffect(() => {
    const tl = createTimeline();
    tl.label("start");
    tl.add("#levels-day2-icon", {
      scale: [1.25, 1],
      duration: 550,
      ease: "inOutCirc",
    })
      .add(
        "#levels-day1-icon",
        {
          translateX: ["20vw", 0],
          duration: 550,
          ease: "inOutCirc",
        },
        "start",
      )
      .add(
        "#levels-day3-icon",
        {
          translateX: ["-20vw", 0],
          duration: 550,
          ease: "inOutCirc",
        },
        "start",
      )
      .add(
        ".levels-header",
        {
          translateY: [10, 0],
          opacity: [0, 1],
          duration: 550,
          ease: "inOut",
        },
        "<-=200",
      );
    tl.init();
  }, []);

  return (
    <main className="w-screen h-screen w-max-screen w-min-screen h-max-screen h-min-screen bg-linear-to-b from-[#a3c8c9] from-4% to-blue text-white pt-20 px-20">
      <h1 className="w-full text-center capitalize font-bold font-display text-8xl mb-20">
        Levels
      </h1>
      <section className="flex w-full justify-between items-stretch gap-50">
        {levels.map((level) => (
          <article key={level.name} className="w-full max-h-full">
            <p
              id={`levels-${level.id}-header`}
              className="levels-header text-white text-6xl w-full text-center font-serif mb-10"
            >
              {level.name}
            </p>
            <LevelIcon
              {...level}
              isLocked={dayjs().isBefore(level.unlockDate)}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
