import { Body } from "matter-js";
import { useState } from "react";

//Painel de informações do sistema 2
export default function SystemTwoPanel({
  blocks,
  getAcceleration,
}: {
  blocks: Body[];
  getAcceleration: () => number;
}) {
  //No código é calculado a tração que o bloco anterior faz no bloco atual, se for o bloco A não calcula isso
  const shouldLabelShowTractionForce = (label: string) => {
    if (label != "A") {
      return true;
    }
    return false;
  };

  const aceleracao = getAcceleration();

  //calcula a tracao necessaria pra puxar todos os blocos abaixo de um determinado bloco q é declarado pelo indice recebido
  const getTracao = (index: number) => {
    const blocosAbaixo = blocks.slice(index);
    const somaAbaixo = blocosAbaixo.reduce((acc, b) => acc + b.mass, 0);
    return somaAbaixo * (10 - Math.abs(aceleracao));
  };

  //funcao pra pegar a letra anterior do alfabeto só pra desenhar na label
  const getLetraAnterior = (letra: string) => {
    return String.fromCharCode(letra.charCodeAt(0) - 1);
  };

  return (
    <div className="w-full h-full flex flex-col align-center">
      <h1>Informações</h1>
      {/* é desenhado as labels e os inputs de cada bloco "ouvindo" as mudanças no state blocks */}
      {blocks.map((block) => {
        if (!block) return null;

        return (
          <div
            className="w-full h-auto flex flex-col justify-between m-1"
            key={block.label}
          >
            <label>{`Massa: ${block.label}`}</label>
            <input
              readOnly
              className="w-full border-1 rounded-sm"
              type="text"
              value={`${block.mass.toFixed(2)} KG`}
            />
            {/* Aqui usa a função acima pra determinar se mostra ou nao a tração */}
            {shouldLabelShowTractionForce(block.label) && (
              <>
                <label>{`T(${getLetraAnterior(block.label)}${block.label}) = T(${block.label}${getLetraAnterior(block.label)})`}</label>
                <input
                  readOnly
                  className="w-full border-1 rounded-sm"
                  type="text"
                  value={`${getTracao(blocks.indexOf(block)).toFixed(2)} N`}
                />
              </>
            )}
          </div>
        );
      })}
      <label>Aceleração(m/s²)</label>
      <input
        readOnly
        className="w-full border-1 rounded-sm"
        type="text"
        value={Math.abs(getAcceleration()).toFixed(2)}
      />
    </div>
  );
}
