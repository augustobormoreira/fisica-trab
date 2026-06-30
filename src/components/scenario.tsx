"use client";

import { RefObject } from "react";

//Componente responsável por exibir os sistemas
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
