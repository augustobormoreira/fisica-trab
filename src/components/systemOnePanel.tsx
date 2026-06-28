import { Collision } from "@/types/collision";
import { Body } from "matter-js";
import { RefObject, useEffect, useRef, useState } from "react";

export default function SystemOnePanel({
  blocks,
  findAcceleration,
  setForcaInicial,
  applyForce,
  startSystem,
  systemReset,
  collisions,
  setForcasEntreBlocos,
}: {
  blocks: Body[];
  findAcceleration: (f: number, atritos: number, massas: number) => string;
  setForcaInicial: (valor: number) => void;
  applyForce: () => void;
  startSystem: boolean;
  systemReset: boolean;
  collisions: Collision[];
  getMassByLabel: (label: string) => number;
  setForcasEntreBlocos: (label: string, valor: number) => void;
}) {
  const initialForceRef = useRef<number>(0);
  const [initialForceInput, setInitialForce] = useState<number>(0);
  useEffect(() => {
    if (!startSystem) return;
    if (initialForceRef.current === 0) return;
    applyForce();
  }, [startSystem]);

  let somaAtritos = 0;
  let somaMassas = 0;

  if (blocks.length > 0) {
    somaAtritos += blocks[0].friction * 10 * blocks[0].mass;
    somaMassas += blocks[0].mass;

    for (let i = 1; i < blocks.length; i++) {
      const blocoAnterior = blocks[i - 1];
      const blocoAtual = blocks[i];

      const nomeColisao = `colisao${blocoAnterior.label}${blocoAtual.label}`;
      const jaColidiu = collisions.some((c) => c.collisionName === nomeColisao);

      if (jaColidiu) {
        somaAtritos += blocoAtual.friction * 10 * blocoAtual.mass;
        somaMassas += blocoAtual.mass;
      }
    }
  }

  const currentAcceleration = startSystem
    ? findAcceleration(initialForceRef.current, somaAtritos, somaMassas)
    : "0";

  const forcasCalculadas: number[] = [];
  const forcasEntreBlocos = collisions.map((collision, index) => {
    const labels = collision.collisionName.replace("colisao", "");
    const labelAnterior = labels[0];
    const blocoAnterior = blocks.find((b) => b.label === labelAnterior);
    if (!blocoAnterior) return null;

    const forcaAnterior =
      index === 0 ? initialForceRef.current : forcasCalculadas[index - 1];

    const forca =
      forcaAnterior -
      blocoAnterior.friction * blocoAnterior.mass * 10 -
      blocoAnterior.mass * parseFloat(currentAcceleration);

    forcasCalculadas.push(forca);
    setForcasEntreBlocos(`${labelAnterior}${labels[1]}`, forca);
    return { labelAnterior, labelAtual: labels[1], forca };
  });

  return (
    <div className="w-full h-full flex flex-col align-center overflow-y-auto">
      <h1>Informações</h1>
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
        className="w-full h-auto border-1 rounded-sm mt-2 mb-2 "
        value={currentAcceleration}
      />
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
            <label>{`Força Atrito Estático: ${block.label}`}</label>
            <input
              readOnly
              className="w-full h-auto border-1 rounded-sm mb-2"
              type="text"
              value={`${block.mass * 10 * block.frictionStatic} N`}
            />
          </div>
        );
      })}
    </div>
  );
}
