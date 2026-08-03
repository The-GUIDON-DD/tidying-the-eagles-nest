import dayjs from "dayjs";
import { Link } from "react-router";

function LevelIcon({
  link,
  icon,
  name,
  bgColor,
  isLocked,
}: {
  link: string;
  icon: string;
  name: string;
  bgColor: string;
  isLocked: boolean;
}) {
  return (
    <Link to={!isLocked ? link : ""}>
      <article
        style={{ backgroundColor: bgColor }}
        className={`aspect-square grow border-10 border-rich-black flex items-center justify-center p-[15%] relative`}
      >
        <img
          src={icon}
          alt={name}
          className="w-full h-full max-w-full max-h-full"
        />
        {/* locked layer */}
        {isLocked && (
          <div className="size-full absolute inset-0 bg-[rgba(0,0,0,0.3)] flex items-center justify-center">
            <img src="/levels/lock.svg" alt="Locked" className="w-[20%]" />
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
      icon: "/levels/day1.svg",
      link: "/level/day/1",
      bgColor: "var(--color-bright-yellow)",
      unlockDate: dayjs("August 3, 2026"),
    },
    {
      name: "Day 2",
      icon: "/levels/day2.svg",
      link: "/level/day/2",
      bgColor: "var(--color-pale-yellow)",
      unlockDate: dayjs("August 4, 2026"),
    },
    {
      name: "Day 3",
      icon: "/levels/day3.svg",
      link: "/level/day/3",
      bgColor: "var(--color-deep-blue)",
      unlockDate: dayjs("August 5, 2026"),
    },
  ];

  return (
    <main className="w-screen h-screen w-max-screen w-min-screen h-max-screen h-min-screen bg-linear-to-b from-[#a3c8c9] from-4% to-blue text-white pt-20 px-20">
      <h1 className="w-full text-center capitalize font-bold font-display text-8xl mb-20">
        Levels
      </h1>
      <section className="flex w-full justify-between items-stretch gap-50">
        {levels.map((level) => (
          <article key={level.name} className="w-full max-h-full">
            <p className="text-white text-6xl w-full text-center font-serif mb-10">
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
