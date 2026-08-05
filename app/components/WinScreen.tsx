import { animate, createTimeline, cubicBezier, spring } from "animejs";
import html2canvas from "html2canvas";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import ShareImage from "./ShareImage";

interface BGIndex {
  [key: number]: string;
}
const BGs: BGIndex = {
  1: "/day1/sharebg.png",
};

const MAX_SCREEN_SIZE =
  "w-screen h-screen max-w-screen min-w-screen max-h-screen min-h-screen";

function BgBanner() {
  const GRID_OVERLAY_CHILD = "row-start-1 row-span-1 col-start-1 col-span-1";

  useEffect(() => {
    const BEZIER_OUT = cubicBezier(0.1, 0.7, 0.5, 1);
    const tl = createTimeline();
    tl.label("start")
      .add("#win-white-banner", {
        x: ["100vw", 0],
        duration: 300,
        ease: BEZIER_OUT,
      })
      .add("#win-purple-banner", {
        x: ["-100vw", 0],
        duration: 300,
        ease: BEZIER_OUT,
      })
      .label("line-entrance")
      .add(
        "#win-top-line",
        {
          x: ["200vw", "100vw"],
          duration: 2000,
          ease: BEZIER_OUT,
        },
        "line-entrance",
      )
      .add(
        "#win-bottom-line",
        {
          x: ["-200vw", "-100vw"],
          duration: 2000,
          ease: BEZIER_OUT,
        },
        "line-entrance",
      )
      .label("line-scroll")
      .add(
        "#win-top-line",
        {
          x: ["100vw", 0],
          duration: 200000,
          loop: true,
        },
        "line-scroll",
      )
      .add(
        "#win-bottom-line",
        {
          x: ["-100vw", 0],
          duration: 200000,
          loop: true,
        },
        "line-scroll",
      );
    tl.init();
  }, []);

  return (
    <div
      id="win-screen"
      className={`fixed inset-0 ${MAX_SCREEN_SIZE} z-50 grid grid-cols-1 grid-rows-1 place-items-center`}
      style={{
        background:
          "radial-gradient(rgba(255,255,255,0.3), rgba(255,255,255,0)), rgba(103,74, 179, 0.6)",
      }}
    >
      <div
        id="win-white-banner"
        className={`${GRID_OVERLAY_CHILD} h-[40%] w-full bg-white drop-shadow-[0_4px_21px_37px_rgba(0,0,0,0.1)]`}
      />
      <div
        id="win-purple-banner"
        className={`${GRID_OVERLAY_CHILD} h-[34%] w-full`}
        style={{
          background: "radial-gradient(#5d3e9e, #390f8f), purple",
          filter: "brightness(0.9)",
        }}
      />
      <div
        id="win-top-line"
        className={`${GRID_OVERLAY_CHILD} h-[30%] w-[300vw]`}
        style={{
          background:
            "repeat-x top center / 100vw auto url('/level_win/top-line.svg')",
        }}
      />
      <div
        id="win-bottom-line"
        className={`${GRID_OVERLAY_CHILD} h-[30%] w-[300vw]`}
        style={{
          background:
            "repeat-x bottom center / 100vw auto url('/level_win/top-line.svg')",
        }}
      />
    </div>
  );
}

function WinPage1({ nextPage }: { nextPage: () => void }) {
  useEffect(() => {
    const tl = createTimeline();
    tl.add(
      "#win-content-1",
      {
        opacity: [0, 1],
        duration: 750,
        ease: "outExpo",
      },
      750,
    )
      .add(
        "#win-well-done",
        {
          scale: [0, 1],
          ease: spring({
            bounce: 0.65,
            duration: 350,
          }),
        },
        "<-150",
      )
      .init();
  }, []);

  function onContinueButton() {
    animate("#win-content-1", {
      scale: [1, 0],
      duration: 250,
      ease: "outExpo",
    }).then(nextPage);
  }

  return (
    <div
      id="win-content-1"
      className={`fixed inset-0 ${MAX_SCREEN_SIZE} z-50 flex flex-col gap-6 items-center justify-center hidable`}
    >
      <img
        alt="Well Done!"
        id="win-well-done"
        src="/level_win/well-done.svg"
        className="h-[10vh] mt-[-9vh]"
      />
      <p className="font-display italic font-bold text-3xl text-white text-center w-[80%]">
        Remember that one of the most telling marks of a true wanderer is having
        everything they need within arm's reach. Good luck, and may the gear in
        your satchel bring you to success! Don't celebrate just yet, though, for
        there is one more trial you forgot to consider.
      </p>
      <button
        type="button"
        className="flex font-display text-white text-lg font-bold gap-2 items-center uppercase"
        onClick={onContinueButton}
      >
        <p>CONTINUE</p>
        <img
          alt="Continue"
          src="/levels/back.svg"
          className="h-[2em] -scale-x-100"
        />
      </button>
    </div>
  );
}

function downloadImage() {
  const resultsDiv = document.getElementById("resultsScreenshot");
  if (!resultsDiv) return;
  html2canvas(resultsDiv).then((canvas) => {
    const resultsLink = document.createElement("a");
    resultsLink.download = "TidyingTheEaglesNest-Day1.png";
    resultsLink.href = canvas.toDataURL("image/png", 1);
    resultsLink.click();
  });
}

function shareResult() {
  if (navigator.share && navigator.canShare) {
    const resultsDiv = document.getElementById("resultsScreenshot");
    if (!resultsDiv) return;
    html2canvas(resultsDiv).then((canvas) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const shareData = {
            title: "TidyingTheEaglesNest-Day1",
            files: [
              new File([blob], "TidyingTheEaglesNest-Day1.png", {
                type: blob.type,
              }),
            ],
          };

          if (navigator.canShare(shareData)) {
            navigator.share(shareData).catch(() => downloadImage());
          } else {
            downloadImage();
          }
        },
        "image/png",
        1,
      );
    });
  } else {
    downloadImage();
  }
}
function WinPage2({
  prevPage,
  day = 1,
  time,
}: {
  prevPage: () => void;
  day?: number;
  time: string;
}) {
  useEffect(() => {
    animate("#win-content-2", {
      scale: [0, 1],
      duration: 350,
      ease: "outExpo",
    });
  }, []);

  function onBackButton() {
    animate("#win-content-2", {
      scale: [1, 0],
      duration: 250,
      ease: "outExpo",
    }).then(prevPage);
  }
  return (
    <>
      {/* hidden share image to export to png */}
      <div className="z-0 w-[439px]" id="resultsScreenshot">
        {/* set to 30vw since I won't check font size... it's a bit lazy tbh */}
        <ShareImage bg={BGs[day]} width="105%" time={time} />
      </div>
      <div
        id="win-content-2"
        className={`fixed inset-0 ${MAX_SCREEN_SIZE} flex items-center justify-evenly z-50`}
      >
        <button
          type="button"
          onClick={onBackButton}
          className="flex font-display text-white text-2xl font-bold gap-2 items-center uppercase"
        >
          <img alt="Continue" src="/levels/back.svg" className="h-[2.5rem]" />
          <p>Back</p>
        </button>
        <div className="flex flex-col items-center">
          <img
            src="/level_win/share-your-results.svg"
            alt="Share your results!"
            className="w-[50vw] mb-[-6vh] z-51"
          />
          <div className="h-[75vh] w-[30vw] border-14 border-[#361876] bg-[#363636] drop-shadow-[0_15px_34px_rgba(0,0,0,0.25)] overflow-clip">
            <ShareImage bg={BGs[day]} width="100%" time={time} />
          </div>
          <button type="button" onClick={shareResult}>
            <img
              src={"/level_win/download.svg"}
              alt="Download"
              className="h-[5vh] mt-10"
            />
          </button>
        </div>
        <Link
          to="/"
          className="flex font-display text-white text-2xl font-bold gap-2 items-center uppercase"
        >
          <p>Home</p>
          <img
            alt="Continue"
            src="/levels/back.svg"
            className="h-[2.5rem] -scale-x-100"
          />
        </Link>
      </div>
    </>
  );
}

export default function WinScreen({
  day = 1,
  time,
}: {
  day?: number;
  time: string;
}) {
  const root = useRef(null);
  const pages = [
    <WinPage1 key={0} nextPage={() => changePage(1)} />,
    <WinPage2 key={1} day={day} prevPage={() => changePage(0)} time={time} />,
  ];
  const [curPage, setPage] = useState(0);

  function changePage(pageNum: number) {
    setPage(pageNum);
  }

  return (
    <div ref={root} id="win-content">
      <BgBanner />
      {pages[curPage]}
    </div>
  );
}
