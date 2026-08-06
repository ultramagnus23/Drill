import { Suspense } from "react";
import ScoreForm from "./ScoreForm";

export default function ScorePage() {
  return (
    <Suspense fallback={null}>
      <ScoreForm />
    </Suspense>
  );
}
