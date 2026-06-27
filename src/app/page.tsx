"use client";
import { Scenario } from "@/components/scenario";
import { ManagementPanel } from "@/components/managementPanel";
import { useRef, useState, useCallback, RefObject, useEffect } from "react";
import { useBlocksScene } from "@/hooks/useBlocksScene";
import { Sistema } from "@/types";
import Matter from "matter-js";
import { usePulleyNewScene } from "@/hooks/usePulleyNewScene";
import { BlockModal } from "@/components/blockModal";
import AlternateOptions from "@/components/alternateOptionsModal";
import SystemOnePanel from "@/components/systemOnePanel";
import SystemTwoPanel from "@/components/systemTwoPanel";

export default function Home() {
  const sceneRef1 = useRef<HTMLDivElement>(null);
  const sceneRef2 = useRef<HTMLDivElement>(null);
  const [selectedBody, setSelectedBody] = useState<Matter.Body | null>(null);
  const [selectedBody2, setSelectedBody2] = useState<Matter.Body | null>(null);
  const [startSystem, setStartSystem] = useState<boolean>(false);
  const [colidiuAB, setColidiuAB] = useState<boolean>(false);
  const [colidiuBC, setColidiuBC] = useState<boolean>(false);
  const [systemReset, setSystemReset] = useState<boolean>(false);
  const [selectedAlternateOption, setSelectedAlternateOption] = useState<
    string | null
  >(null);
  const [rightBlockCount, setRightBlockCount] = useState<number>(2);
  const [sistemaAtivo, setSistemaAtivo] = useState<Sistema>("sistema1");
  const [blocks, setBlocks] = useState<RefObject<Matter.Body | null>[]>([]);
  const [blocksS2, setBlocksS2] = useState<Matter.Body[]>([]);

  const handleBlockClick = useCallback((body: Matter.Body) => {
    setSelectedBody(body);
    disableMouse();
  }, []);

  const {
    applyForce,
    resetPositionOfAllBlocks,
    getBlocksAsArray,
    disableMouse,
    enableMouse,
    findAcceleration,
    findFrictionForce,
    findForceA_B,
    findForceB_C,
    setForcaInicial,
    setMassaReal,
    massaRealA,
    massaRealB,
    massaRealC,
  } = useBlocksScene(
    sceneRef1,
    handleBlockClick,
    () => setColidiuAB(true),
    () => setColidiuBC(true),
  );

  const setAlternateOption = (alternateOption: string) => {
    setSelectedAlternateOption(alternateOption);
  };

  const {
    resetAllPositions,
    startForce,
    getAllBlocksAsArray,
    getAcceleration,
    enableMouse2,
    disableMouse2,
    setMassaBloco,
  } = usePulleyNewScene(sceneRef2, rightBlockCount, 10, 20, (body) => {
    setSelectedBody2(body);
    disableMouse2();
  });

  useEffect(() => {
    setBlocks(getBlocksAsArray());
  }, []);
  useEffect(() => {
    const blocks = getAllBlocksAsArray();
    if (blocks.length > 0) {
      setBlocksS2(blocks);
    }
  }, [rightBlockCount]);

  const handleReset = () => {
    resetPositionOfAllBlocks();
    setColidiuAB(false);
    setColidiuBC(false);
    setStartSystem(false);
    setSystemReset((prev) => !prev);
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      <div className="w-1/5 shrink-0 h-full border-r border-gray-300 flex items-start pt-4 justify-center">
        <ManagementPanel
          resetPositionOfAllBlocks={handleReset}
          onSistemaChange={setSistemaAtivo}
          startForce={startForce}
          resetAllPositions={resetAllPositions}
          setStartSystem={setStartSystem}
          setSystemReset={setSystemReset}
          setAlternateOption={setAlternateOption}
          setRightBlockCount={setRightBlockCount}
        />
      </div>

      <div className="w-3/5 h-full relative overflow-hidden">
        <div
          className={`absolute inset-0 ${sistemaAtivo === "sistema1" ? "block" : "hidden"}`}
        >
          <Scenario sceneRef={sceneRef1} />
        </div>
        <div
          className={`absolute inset-0 ${sistemaAtivo === "sistema2" ? "block" : "hidden"}`}
        >
          <Scenario sceneRef={sceneRef2} />
        </div>
      </div>

      <div className="w-1/5 shrink-0 h-full border-l border-gray-300 flex flex-col items-start pt-4 px-4 gap-2">
        {sistemaAtivo === "sistema1" && (
          <SystemOnePanel
            blocks={blocks}
            findAcceleration={findAcceleration}
            findForceA_B={findForceA_B}
            findForceB_C={findForceB_C}
            findFrictionForce={findFrictionForce}
            setForcaInicial={setForcaInicial}
            applyForce={applyForce}
            startSystem={startSystem}
            colidiuAB={colidiuAB}
            colidiuBC={colidiuBC}
            systemReset={systemReset}
            massaRealA={massaRealA}
            massaRealB={massaRealB}
            massaRealC={massaRealC}
          />
        )}

        {sistemaAtivo === "sistema2" && (
          <SystemTwoPanel
            blocks={blocksS2}
            getAcceleration={getAcceleration}
          />
        )}
      </div>

      {selectedBody && (
        <BlockModal
          system={sistemaAtivo}
          body={selectedBody}
          massaReal={
            selectedBody.label === "A"
              ? massaRealA.current
              : selectedBody.label === "B"
                ? massaRealB.current
                : massaRealC.current
          }
          onSave={(label, massaReal) => setMassaReal(label, massaReal)}
          onClose={() => {
            setSelectedBody(null);
            enableMouse2();
          }}
        />
      )}

      {selectedBody2 && (
        <BlockModal
          system={sistemaAtivo}
          body={selectedBody2}
          onClose={() => {
            setSelectedBody2(null);
            enableMouse();
          }}
        />
      )}

      {selectedAlternateOption && (
        <AlternateOptions
          label={selectedAlternateOption}
          onClose={() => setSelectedAlternateOption(null)}
          setMassa={sistemaAtivo=="sistema1" ? setMassaReal : setMassaBloco}
          system={sistemaAtivo}
          rightBlockCount={rightBlockCount}
        />
      )}
    </div>
  );
}
