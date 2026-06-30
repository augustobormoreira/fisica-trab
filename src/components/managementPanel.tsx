"use client";
import { Sistema } from "@/types";
import { useState } from "react";

//Painel de gerenciamento dos sistemas, o que fica na esquerda
export const ManagementPanel = ({
  resetPositionOfAllBlocks,
  onSistemaChange,
  startForce,
  resetAllPositions,
  setStartSystem,
  setSystemReset,
  setAlternateOption,
  setRightBlockCount,
  setSystem1BlockCount,
}: {
  resetPositionOfAllBlocks: () => void;
  onSistemaChange: (sistema: Sistema) => void;
  startForce: () => void;
  resetAllPositions: () => void;
  setStartSystem: (startSystem: boolean) => void;
  setSystemReset: (resetSystem: boolean) => void;
  setAlternateOption: (alternateOption: string) => void;
  setRightBlockCount: (rightBlockCount: number) => void;
  setSystem1BlockCount: (val: number) => void;
}) => {
  //state de controle para saber qual o sistema atual pra carregar opções de configuração baseados em cada um
  const [sistemaAtual, setSistema] = useState<Sistema>("sistema1");

  //Callback recebida para poder setar qual sistema deve ser exibido na dom
  const setSistemaPainelEAtual = (sistema: Sistema) => {
    setSistema(sistema);
    onSistemaChange(sistema);
  };

  return (
    <div className=" flex flex-col items-center w-full h-auto gap-1">
      <div className="flex flex-col w-full gap-1 justify-center items-center">
        <button
          onClick={() => setSistemaPainelEAtual("sistema1")}
          className="w-3/5 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
        >
          Sub-Sistema 1
        </button>
        <button
          onClick={() => setSistemaPainelEAtual("sistema2")}
          className="w-3/5 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
        >
          Sub-Sistema 2
        </button>
      </div>
      <div className="flex flex-col justify-center items-center w-full h-auto mt-4">
        {/* Carrega opções de configuração do sistema 1 */}
        {sistemaAtual === "sistema1" && (
          <>
            <div className="flex flex-col items-center w-50 mt-3 gap-1">
              <label className="text-sm font-serif text-gray-600">
                Blocos (2-10)
              </label>
              <input
                type="number"
                min={2}
                max={10}
                defaultValue={7}
                onChange={(e) => {
                  const val = Math.min(10, Math.max(2, Number(e.target.value)));
                  setSystem1BlockCount(val);
                }}
                className="w-full text-center border-1 border-gray-500 rounded-xs font-serif focus:outline-none focus:border-gray-700"
              />
            </div>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                setStartSystem(true);
              }}
            >
              Start
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                resetPositionOfAllBlocks();
                setStartSystem(false);
                setSystemReset(true);
              }}
            >
              Reset
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                setAlternateOption("PA");
              }}
            >
              PA
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                setAlternateOption("PG");
              }}
            >
              PG
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                setAlternateOption("AR");
              }}
            >
              Randomizar
            </button>
          </>
        )}
        {/* Carrega opções de configuração do sistema 2 */}
        {sistemaAtual === "sistema2" && (
          <>
            <div className="flex flex-col items-center w-50 mt-3 gap-1">
              <label className="text-sm font-serif text-gray-600">
                Blocos direita (1-8)
              </label>
              <input
                type="number"
                min={1}
                max={8}
                defaultValue={2}
                onChange={(e) => {
                  const val = Math.min(8, Math.max(1, Number(e.target.value)));
                  setRightBlockCount(val);
                }}
                className="w-full text-center border-1 border-gray-500 rounded-xs font-serif focus:outline-none focus:border-gray-700"
              />
            </div>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                startForce();
              }}
            >
              Start
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                resetAllPositions();
              }}
            >
              Reset
            </button>
            <button
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
              onClick={() => {
                setAlternateOption("PA");
              }}
            >
              PA
            </button>
            <button
              onClick={() => {
                setAlternateOption("PG");
              }}
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
            >
              PG
            </button>
            <button
              onClick={() => {
                setAlternateOption("AR");
              }}
              className="w-50 h-auto font-serif border-1 rounded-xs border-gray-500 hover:text-white hover:bg-gray-500"
            >
              Randomizar
            </button>
          </>
        )}
      </div>
    </div>
  );
};
