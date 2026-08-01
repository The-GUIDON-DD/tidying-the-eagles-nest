import { Link } from "react-router";

function LevelIcon({
  link,
  icon,
  name,
  bgColor,
}: {
  link: string;
  icon: string;
  name: string;
  bgColor: string;
}) {
  return (
    <Link to={link}>
      <article
        style={{ backgroundColor: bgColor }}
        className={`aspect-square grow border-10 border-rich-black flex items-center justify-center p-15`}
      >
        <img
          src={icon}
          alt={name}
          className="w-full h-full max-w-full max-h-full"
        />
      </article>
    </Link>
  );
}
export default function LevelsScreen() {
  const levels = [
    {
      name: "Day 1",
      icon: "/levels/day1.svg",
      link: "/level/day1",
      bgColor: "var(--color-bright-yellow)",
    },
    {
      name: "Day 2",
      icon: "/levels/day2.svg",
      link: "/level/day2",
      bgColor: "var(--color-pale-yellow)",
    },
    {
      name: "Day 3",
      icon: "/levels/day3.svg",
      link: "/level/day3",
      bgColor: "var(--color-deep-blue)",
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
            <LevelIcon {...level} />
          </article>
        ))}
      </section>
    </main>
  );
}
