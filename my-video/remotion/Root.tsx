import { Composition } from "remotion";
import { videoConf } from "../config/scenes";
import { GoToRecorder } from "./GoToRecorder";
import { Main } from "./Main";
import { calcMetadata } from "./calculate-metadata/calc-metadata";
import { DrumkoAd } from "./DrumkoAd";
import { DrumkoAd2 } from "./DrumkoAd2";
import { DrumkoAd3 } from "./DrumkoAd3";
import { DrumkoAd4 } from "./DrumkoAd4";
import { DrumkoAd5 } from "./DrumkoAd5";
import { DrumkoAdPremier } from "./DrumkoAdPremier";

export const RemotionRoot = () => {
  return (
    <>
      {/* ── Drumko ad variations ─────────────────────────── */}
      <Composition component={DrumkoAd}  id="drumko-ad"   width={1080} height={1920} fps={30} durationInFrames={540} />
      <Composition component={DrumkoAd2} id="drumko-ad-2" width={1080} height={1920} fps={30} durationInFrames={300} />
      <Composition component={DrumkoAd3} id="drumko-ad-3" width={1080} height={1920} fps={30} durationInFrames={450} />
      <Composition component={DrumkoAd4} id="drumko-ad-4" width={1080} height={1920} fps={30} durationInFrames={390} />
      <Composition component={DrumkoAd5}      id="drumko-ad-5"   width={1080} height={1920} fps={30} durationInFrames={450} />
      <Composition component={DrumkoAdPremier} id="drumko-premier" width={1080} height={1920} fps={30} durationInFrames={540} />
      <Composition
        component={Main}
        id="welcome"
        schema={videoConf}
        defaultProps={{
          theme: "light" as const,
          canvasLayout: "square" as const,
          scenes: [
            {
              type: "recorder" as const,
              durationInFrames: 80,
              music: "epic" as const,
              transitionToNextScene: true,
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              type: "videoscene" as const,
              webcamPosition: "previous" as const,
              endOffset: 0,
              transitionToNextScene: true,
              newChapter: "",
              stopChapteringAfterThis: false,
              music: "previous" as const,
              startOffset: 0,
              bRolls: [],
            },
            {
              music: "previous" as const,
              transitionToNextScene: true,
              type: "endcard" as const,
              durationInFrames: 200,
              channel: "remotion" as const,
              links: [
                { link: "remotion.dev/recorder" },
                { link: "remotion.dev/discord" },
              ],
            },
          ],
          scenesAndMetadata: [],
          platform: "x" as const,
        }}
        calculateMetadata={calcMetadata}
      />
      <Composition
        component={GoToRecorder}
        id="record"
        width={1080}
        height={1080}
        fps={30}
        durationInFrames={100}
      />
      <Composition
        component={Main}
        id="empty"
        schema={videoConf}
        defaultProps={{
          theme: "light" as const,
          canvasLayout: "square" as const,
          platform: "youtube",
          scenes: [],
          scenesAndMetadata: [],
        }}
        calculateMetadata={calcMetadata}
      />
    </>
  );
};
