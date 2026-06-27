import { Collision } from "@/types/collision";
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
  collisions,
  getMassByLabel,
}: {
  blocks: Body[];
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
  collisions: Collision[];
  getMassByLabel: (label: string) => number;
}) {
  const initialForceRef = useRef<number>(0);
  const [initialForceInput, setInitialForce] = useState<number>(0);
  const [acceleration, setAcceleration] = useState<string>("0");
  const forcasCalculadas: number[] = [];
  const forcasEntreBlocos = collisions.map((collision, index) => {
    const labels = collision.collisionName.replace("colisao", "");
    const labelAnterior = labels[0];
    const labelAtual = labels[1];
    const blocoAnterior = blocks.find((b) => b.label === labelAnterior);
    if (!blocoAnterior) return null;

    const forcaAnterior =
      index === 0 ? initialForceRef.current : forcasCalculadas[index - 1];

    const forca =
      forcaAnterior -
      blocoAnterior.friction * blocoAnterior.mass * 10 -
      blocoAnterior.mass * parseFloat(acceleration);

    forcasCalculadas.push(forca);
    return { labelAnterior, labelAtual, forca };
  });

  useEffect(() => {
    if (!startSystem) return;
    if (initialForceRef.current === 0) return;

    let somaAtritos = 0,
      somaMassas = 0;

    for (let i = 0; i < blocks.length; i++) {
      somaAtritos += blocks[i].friction * 10 * blocks[i].mass;
      somaMassas += blocks[i].mass;
    }

    setAcceleration(
      findAcceleration(initialForceRef.current, somaAtritos, somaMassas),
    );
    applyForce();
  }, [startSystem, initialForceInput]);

  useEffect(() => {
    setAcceleration("0");
  }, [systemReset]);

  return (
    <div className="w-full h-full flex flex-col align-center overflow-y-auto">
      <h1>Informações</h1>
      {blocks.map((block) => {
        if (!block) return null;
        return (
          <div
            className="w-full h-auto flex flex-col justify-between mx-0"
            key={block.label}
          >
            <label>{`Massa: ${block.label}`}</label>
            <input
              readOnly
              className="w-full h-auto border-1 rounded-sm"
              type="text"
              value={`${block.mass} KG`}
            />
            <label>{`Força Atrito Cinético: ${block.label}`}</label>
            <input
              readOnly
              className="w-full h-auto border-1 rounded-sm mb-2"
              type="text"
              value={`${block.mass * 10 * block.frictionStatic} N`}
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
      {forcasEntreBlocos.map((item) => {
        if (!item) return null;
        return (
          <div
            key={`${item.labelAnterior}${item.labelAtual}`}
            className="w-full flex flex-col"
          >
            <label className="mt-3">{`F(${item.labelAnterior}→${item.labelAtual}):`}</label>
            <input
              readOnly
              className="w-full h-auto border-1 rounded-sm mt-2"
              value={`${item.forca.toFixed(2)} N`}
            />
          </div>
        );
      })}
    </div>
  );
}
