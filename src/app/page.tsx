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
import { Collision } from "@/types/collision";

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
  const [blocks, setBlocks] = useState<Matter.Body []>([]);
  const [blocksS2, setBlocksS2] = useState<Matter.Body[]>([]);
  const [collisions, setCollisions] = useState<Collision[]>([]);
  const [system1BlockCount, setSystem1BlockCount] = useState<number>(7);

  const handleBlockClick = useCallback((body: Matter.Body) => {
    setSelectedBody(body);
    disableMouse();
  }, []);

  const {
    applyForce,
    resetPositionOfAllBlocks,
    disableMouse,
    enableMouse,
    findAcceleration,
    setForcaInicial,
    setMassa,
    getAllBoxes,
    getMassByLabel,
  } = useBlocksScene(
    sceneRef1,
    handleBlockClick,
    (newCollisions) => setCollisions([...newCollisions]),
    system1BlockCount,
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
    setBlocks(getAllBoxes());
  }, [system1BlockCount]);
  useEffect(() => {
    const blocks = getAllBlocksAsArray();
    if (blocks.length > 0) {
      setBlocksS2(blocks);
    }
  }, [rightBlockCount]);

  const handleReset = () => {
    resetPositionOfAllBlocks();
    setCollisions([])
    setStartSystem(false);
    setSystemReset((prev) => !prev);
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      <div className="w-1/5 shrink-0 h-full border-l border-gray-300 flex flex-col items-start pt-4 px-4 gap-2 overflow-y-auto min-w-0">
        <ManagementPanel
          resetPositionOfAllBlocks={handleReset}
          onSistemaChange={setSistemaAtivo}
          startForce={startForce}
          resetAllPositions={resetAllPositions}
          setStartSystem={setStartSystem}
          setSystemReset={setSystemReset}
          setAlternateOption={setAlternateOption}
          setSystem1BlockCount={setSystem1BlockCount}
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
            setForcaInicial={setForcaInicial}
            applyForce={applyForce}
            startSystem={startSystem}
            systemReset={systemReset}
            collisions={collisions}
            getMassByLabel={getMassByLabel}
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
          onSave={(label, massaReal) => setMassa(label, massaReal)}
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
          setMassa={sistemaAtivo=="sistema1" ? setMassa : setMassaBloco}
          system={sistemaAtivo}
          rightBlockCount={sistemaAtivo=="sistema1" ? system1BlockCount : rightBlockCount}
        />
      )}
    </div>
  );
}
