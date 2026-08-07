import { Link } from "react-router";
import useSound from "use-sound";
import popSfx from "/sfx/pop.m4a?url";

export default function NavButton({
  link,
  text,
  left = true,
}: {
  link: string;
  text: string;
  left?: boolean;
}) {
  const [popSound] = useSound(popSfx);

  return (
    <Link to={link}>
      <button
        type="button"
        onClick={() => popSound()}
        className={`h-[6vh] flex font-display text-white text-5xl font-bold gap-2 items-stretch uppercase fixed ${left ? "left-8" : "right-8"} top-5`}
      >
        <p>{text}</p>
        <img
          alt="Continue"
          src="/levels/back.svg"
          className={left ? "" : "-scale-x-100"}
        />
      </button>
    </Link>
  );
}
