import { Sistema } from "@/types";
import { Body } from "matter-js";
import { useState } from "react";

//Modal pra configurar os dados de um bloco
export const BlockModal = ({
  body,
  onClose,
  onSave,
  massa,
  system,
}: {
  body: Matter.Body;
  onClose: () => void;
  onSave?: (label: string, massa: number) => void;
  massa?: number;
  system: Sistema;
}) => {
  //state pra informar a massa para o usuário e também receber sua alteração
  const [massaInput, setMassaInput] = useState<number>(massa ?? 0);

  //Função responsável por lidar com a alteração da massa informada no input
  const handleMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMassaInput(val);
    if (val > 0) {
      Body.setMass(body, val);
    }
  };

  //Função responsável por lidar com a alteração do atrito dinâmico informado no input
  const handleFrictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    body.friction = Number(e.target.value);
  };

  //Função responsável por lidar com a alteração do atrito estático informado no input
  const handleStaticFrictionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    Body.set(body, "frictionStatic", Number(e.target.value));
  };

  //Função pra verificar se a massa informada é 0 ou negativo, pois o matter-js encara essas massas como o bloco não existindo
  const performNegativeOrZeroCheckOnSystem1 = () => {
    if (massaInput < 0) {
      alert("Massa não pode ser negativa!");
      return;
    } else if (massaInput == 0) {
      alert("Massa não pode ser zero!");
      return;
    } else {
      onSave!(body.label, massaInput);
      onClose();
    }
  };

  //Função pra verificar se a massa informada é 0 ou negativo, pois o matter-js encara essas massas como o bloco não existindo
  const performNegativeOrZeroCheckOnSystem2 = () => {
    if (massaInput < 0) {
      alert("Massa não pode ser negativa!");
      return;
    } else if (massaInput == 0) {
      alert("Massa não pode ser zero!");
    } else {
      Body.setMass(body, massaInput);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-0lg shadow-xl p-6 w-80 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold"
        >
          X
        </button>
        <h2 className="text-xl font-bold mb-4">{body.label}</h2>

        <label className="block text-sm mb-1">Massa (kg real)</label>
        <input
          type="number"
          value={massaInput}
          onChange={handleMassChange}
          className="border rounded w-full px-2 py-1 mb-4"
        />

        {/* Se for o sistema 1 carrega as informações dos atritos dos blocos */}
        {system === "sistema1" && (
          <>
            <label className="block text-sm mb-1">Atrito Dinâmico</label>
            <input
              type="number"
              step="0.01"
              defaultValue={body.friction}
              onChange={handleFrictionChange}
              className="border rounded w-full px-2 py-1 mb-4"
            />

            <label className="block text-sm mb-1">Atrito Estático</label>
            <input
              type="number"
              step="0.01"
              defaultValue={body.frictionStatic}
              onChange={handleStaticFrictionChange}
              className="border rounded w-full px-2 py-1 mb-4"
            />
            <button
              onClick={performNegativeOrZeroCheckOnSystem1}
              className="w-full bg-blue-400 text-white rounded py-2"
            >
              Salvar
            </button>
          </>
        )}

        {system === "sistema2" && (
          <button
            onClick={performNegativeOrZeroCheckOnSystem2}
            className="w-full bg-blue-400 text-white rounded py-2"
          >
            Salvar
          </button>
        )}
      </div>
    </div>
  );
};
