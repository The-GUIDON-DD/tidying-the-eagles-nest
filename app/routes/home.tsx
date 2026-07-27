export default function Home() {
  const TEXT_CLASS =
    "col-start-2 text-white font-serif text-7xl text-right w-full";
  return (
    <div className="h-screen w-screen max-h-screen max-w-screen overflow-clip grid grid-cols-[4fr_minmax(1fr,fit-content())] gap-y-12 grid-rows-[3em_3em_3em_3em_1fr] bg-radial from-[#586d80] to-[#293b49] py-20 pr-20">
      <img
        src="/Nest.svg"
        className="col-start-1 row-span-5 relative right-[6vw]"
        alt="Envelope"
      />
      <p className={TEXT_CLASS}>Play</p>
      <p className={TEXT_CLASS}>Levels</p>
      <p className={TEXT_CLASS}>How to Play</p>
      <p className={TEXT_CLASS}>Credits</p>
    </div>
  );
}
