export default function Credits() {
  const PAPER_CLASS =
    "aspect-3247/2794 w-[60vw] bg-linear-to-b from-[rgba(217,217,217,0.6)] to-[rgba(45,45,45,0.6)] bg-[#ffefe0] bg-blend-color-burn fixed pt-25 pb-15 px-10";
  const TEXT_CLASS =
    "text-[#595959] text-4xl leading-[1.5em] font-serif w-full text-center";
  return (
    <main className="h-screen w-screen max-h-screen max-w-screen bg-radial from-purple from-25% to-deep-blue to-90% overflow-clip">
      <div className={`${PAPER_CLASS}`}>
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
            <strong>Cheska Huang</strong>,&nbsp;and <strong>Neil Biason</strong>
          </p>
        </section>
      </div>
    </main>
  );
}
