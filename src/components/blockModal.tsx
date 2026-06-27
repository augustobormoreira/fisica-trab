import { Sistema } from "@/types";
import { Body } from "matter-js";
import { useState } from "react";

export const BlockModal = ({
  body,
  onClose,
  onSave,
  massaReal,
  system,
}: {
  body: Matter.Body;
  onClose: () => void;
  onSave?: (label: string, massaReal: number) => void;
  massaReal?: number;
  system: Sistema;
}) => {
  // Controlar o valor do input localmente
  const [massaInput, setMassaInput] = useState<number>(massaReal ?? 0);

  const handleMassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setMassaInput(val);
    Body.setMass(body, val); // mantém sincronizado com Matter.js
  };

  const handleFrictionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    body.friction = Number(e.target.value);
  };

  const handleStaticFrictionChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    Body.set(body, "frictionStatic", Number(e.target.value));
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-0lg shadow-xl p-6 w-80">
        <h2 className="text-xl font-bold mb-4">{body.label}</h2>

        <label className="block text-sm mb-1">Massa (kg real)</label>
        <input
          type="number"
          value={massaInput}
          onChange={handleMassChange}
          className="border rounded w-full px-2 py-1 mb-4"
        />

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
              onClick={() => {
                onSave!(body.label, massaInput); // ← salva o valor do input
                onClose();
              }}
              className="w-full bg-blue-400 text-white rounded py-2"
            >
              Salvar
            </button>
          </>
        )}

        {system === "sistema2" && (
          <button
            onClick={() => {
              Body.setMass(body, massaInput)
              onClose();
            }}
            className="w-full bg-blue-400 text-white rounded py-2"
          >
            Salvar
          </button>
        )}
      </div>
    </div>
  );
};
