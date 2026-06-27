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
}: {
  blocks: Body[];
  findAcceleration: (f: number, atritos: number, massas: number) => string;
  setForcaInicial: (valor: number) => void;
  applyForce: () => void;
  startSystem: boolean;
  systemReset: boolean;
  collisions: Collision[];
  getMassByLabel: (label: string) => number;
}) {
  const initialForceRef = useRef<number>(0);
  const [initialForceInput, setInitialForce] = useState<number>(0);
  const [acceleration, setAcceleration] = useState<string>("0");
  // 1. O useEffect do Start agora só serve para aplicar a força inicial física na engine
  useEffect(() => {
    if (!startSystem) return;
    if (initialForceRef.current === 0) return;
    applyForce();
  }, [startSystem]);

  // 2. Cálculo dinâmico da aceleração com base nas colisões ativas naquele momento
  let somaAtritos = 0;
  let somaMassas = 0;

  if (blocks.length > 0) {
    // O Bloco A sempre faz parte do sistema em movimento
    somaAtritos += blocks[0].friction * 10 * blocks[0].mass;
    somaMassas += blocks[0].mass;

    // Percorre os próximos blocos e só adiciona massa/atrito se houver colisão registrada
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

  // Calcula o valor atualizado a cada renderização (quando collisions atualizar)
  const currentAcceleration = startSystem
    ? findAcceleration(initialForceRef.current, somaAtritos, somaMassas)
    : "0";

  // 3. Lógica das forças de contato (ajustada para usar a aceleração dinâmica)
  const forcasCalculadas: number[] = [];
  const forcasEntreBlocos = collisions.map((collision, index) => {
    const labels = collision.collisionName.replace("colisao", "");
    const labelAnterior = labels[0];
    const blocoAnterior = blocks.find((b) => b.label === labelAnterior);
    if (!blocoAnterior) return null;

    const forcaAnterior =
      index === 0 ? initialForceRef.current : forcasCalculadas[index - 1];

    // Passamos a usar a aceleração real calculada no frame atual
    const forca =
      forcaAnterior -
      blocoAnterior.friction * blocoAnterior.mass * 10 -
      blocoAnterior.mass * parseFloat(currentAcceleration);

    forcasCalculadas.push(forca);
    return { labelAnterior, labelAtual: labels[1], forca };
  });

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
        value={currentAcceleration}
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
