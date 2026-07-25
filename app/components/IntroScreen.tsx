// TODO: To be made into a layout?
import Envelope from "./Envelope";

export default function IntroScreen({ bg = "#bd5d44" }: { bg: string }) {
  return (
    <main className="h-screen w-screen" style={{ background: bg }}>
      <div className="w-1/2 absolute top-[20vh] right-[-10vw] -rotate-12">
        <Envelope isOpen={false} />
      </div>
    </main>
  );
}
