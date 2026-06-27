import { Body } from "matter-js";
import { RefObject, useEffect, useRef, useState } from "react";

export default function SystemOnePanel({
  blocks,
  findAcceleration,
  findForceA_B,
  findForceB_C,
  findFrictionForce,
  setForcaInicial,
  applyForce,
  startSystem,
  colidiuAB,
  colidiuBC,
  systemReset,
  massaRealA,
  massaRealB,
  massaRealC,
}: {
  blocks: RefObject<Body | null>[];
  findAcceleration: (f: number, atritos: number, massas: number) => string;
  findForceA_B: (forca_atrito: number, massa: number) => string;
  findForceB_C: (forca_atrito: number, massa: number) => string;
  findFrictionForce: (label: string, coef: number, peso: number) => number;
  setForcaInicial: (valor: number) => void;
  applyForce: () => void;
  startSystem: boolean;
  colidiuAB: boolean;
  colidiuBC: boolean;
  systemReset: boolean;
  massaRealA: RefObject<number>;
  massaRealB: RefObject<number>;
  massaRealC: RefObject<number>;
}) {
  const initialForceRef = useRef<number>(0);
  const [initialForceInput, setInitialForce] = useState<number>(0);
  const [forceAB, setForceAB] = useState<string>("0");
  const [forceBC, setForceBC] = useState<string>("0");
  const [acceleration, setAcceleration] = useState<string>("0");

  const blocks_array: Body[] = [];
  blocks.map((block) => {
    if (!block.current) return null;
    blocks_array.push(block.current);
  });

  const getMassaReal = (label: string) => {
    if (label === "A") return massaRealA.current ?? 1;
    if (label === "B") return massaRealB.current ?? 1;
    if (label === "C") return massaRealC.current ?? 1;
    return 1;
  };

  useEffect(() => {
  if (!startSystem) return;
  if (initialForceRef.current === 0) return;

  const blockA = blocks[0]?.current;
  const blockB = blocks[1]?.current;
  const blockC = blocks[2]?.current;
  if (!blockA || !blockB || !blockC) return;

  const massaA = massaRealA.current ?? 1;
  const massaB = massaRealB.current ?? 1;
  const massaC = massaRealC.current ?? 1;

  const atrA = findFrictionForce("A", blockA.friction, massaA * 10);
  const atrB = findFrictionForce("B", blockB.friction, massaB * 10);
  const atrC = findFrictionForce("C", blockC.friction, massaC * 10);

  const somaAtritos = atrA
    + (colidiuAB ? atrB : 0)
    + (colidiuBC ? atrC : 0);

  const somaMassas = massaA
    + (colidiuAB ? massaB : 0)
    + (colidiuBC ? massaC : 0);

  setAcceleration(findAcceleration(initialForceRef.current, somaAtritos, somaMassas));
  applyForce();

  if (colidiuAB) {
    setForceAB(findForceA_B(atrA, massaA));
  }

  if (colidiuBC) {
    setForceBC(findForceB_C(atrB, massaB));
  }

}, [startSystem, initialForceInput, colidiuAB, colidiuBC]);


  useEffect(() => {
    setForceAB("0");
    setForceBC("0");
    setAcceleration("0");
  }, [systemReset]);

  return (
    <div className="w-full h-full flex flex-col align-center">
      <h1>Informações</h1>
      {blocks_array.map((block) => {
        if (!block) return null;
        const massaReal = getMassaReal(block.label);
        return (
          <div
            className="w-100 h-auto flex flex-col justify-between m-1"
            key={block.label}
          >
            <label>{`Massa: ${block.label}`}</label>
            <input
              readOnly
              className="w-90 border-1 rounded-sm"
              type="text"
              value={`${massaReal} KG`}
            />
            <label>{`Forca Atrito Estático: ${block.label}`}</label>
            <input
              readOnly
              className="w-90 border-1 rounded-sm"
              type="text"
              value={`${(block.frictionStatic * massaReal * 10).toFixed(2)} N`}
            />
            <label>{`Forca Atrito Dinâmico: ${block.label}`}</label>
            <input
              readOnly
              className="w-90 border-1 rounded-sm"
              type="text"
              value={
                startSystem
                  ? `${findFrictionForce(block.label, block.friction, massaReal * 10)} N`
                  : ""
              }
            />
          </div>
        );
      })}

      <label className="mt-3">Força(N)</label>
      <input
        className="w-full h-auto border-1 rounded-sm mt-2"
        type="text"
        placeholder="Digite a força(N)"
        onChange={(e) => {
          const val = parseInt(e.target.value) || 0;
          initialForceRef.current = val;
          setForcaInicial(val);
          setInitialForce(val);
        }}
      />
      <label className="mt-3">Aceleração(m/s²)</label>
      <input
        readOnly
        className="w-full h-auto border-1 rounded-sm mt-2"
        value={acceleration}
      />
      <label className="mt-3">Força que A faz em B:</label>
      <input
        readOnly
        className="w-full h-auto border-1 rounded-sm mt-2"
        value={forceAB}
      />
      <label className="mt-3">Força que B faz em C:</label>
      <input
        readOnly
        className="w-full h-auto border-1 rounded-sm mt-2"
        value={forceBC}
      />
    </div>
  );
}
