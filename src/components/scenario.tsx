"use client";

import { RefObject } from "react";

export const Scenario = ({
  sceneRef,
}: {
  sceneRef: RefObject<HTMLDivElement | null>;
}) => {
  return (
    <div
      ref={sceneRef}
      className="w-full h-full"
    />
  );
};
