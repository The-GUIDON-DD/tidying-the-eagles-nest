export default function PauseScreen({
  closePauseScreen,
}: {
  closePauseScreen: () => void;
}) {
  return (
    <main className="w-screen h-screen w-max-screen h-max-screen w-min-screen h-min-screen fixed inset-0 bg-cover bg-center bg-[url(/pause-bg.svg)] flex flex-col gap-8 items-center justify-center text-white text-5xl font-sans font-bold uppercase">
      <button type="button" onClick={closePauseScreen}>
        <p>RESUME</p>
      </button>
      <p>How to Play</p>
      <p>Levels</p>
      <p>Reset</p>
    </main>
  );
}
