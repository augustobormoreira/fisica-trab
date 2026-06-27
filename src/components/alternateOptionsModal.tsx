import { Sistema } from "@/types";
import { useState } from "react";

export default function AlternateOptions({
  label,
  onClose,
  setMassa,
  system,
  rightBlockCount = 0,
}: {
  label: string;
  onClose: () => void;
  setMassa: (label: string, valor: number) => void;
  system: Sistema;
  rightBlockCount: number,
}) {
  const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]
  const [numeroInicial, setNumeroInicial] = useState<number>(0);
  const [razao, setRazao] = useState<number>(0);
  const [menor, setMenor] = useState<number>(0);
  const [maior, setMaior] = useState<number>(0);

  const setMassasDeAcordoComSistema = (label: string) => {
    if (system == "sistema1") {
      setMassasDeAcordoComLabelSistema1(label);
    } else {
      setMassasDeAcordoComLabelSistema2(label);
    }
  };

  const setMassasDeAcordoComLabelSistema1 = (label: string) => {
    const index = Math.random() < 0.5 ? rightBlockCount-1 : 0
    if (label === "PG") {
      if(index==rightBlockCount-1){
        let cont = 0;
        for(let i = index; i >= 0; i--){
          setMassa(alphabet[i], numeroInicial * (razao ** (cont++)));
        }
      }
      if(index==0){
        let cont = 0;
        for(let i = index; i <= rightBlockCount; i++){
          setMassa(alphabet[i], numeroInicial * (razao ** (cont++)));
        }
      }
    }
    if (label === "PA") {
      if(index==rightBlockCount-1){
        let cont = 0;
        for(let i = index; i >= 0; i--){
          setMassa(alphabet[i], numeroInicial + (razao * (cont++)));
        }
      }
      if(index==0){
        let cont = 0;
        for(let i = index; i <= rightBlockCount; i++){
          setMassa(alphabet[i], numeroInicial + (razao * (cont++)));
        }
      }
    }
    if (label === "AR") {
      for(let i = 0; i < rightBlockCount; i++) {
        setMassa(alphabet[i], Math.floor(Math.random() * (maior - menor + 1)) + menor)
      }
    }
  };

  const setMassasDeAcordoComLabelSistema2 = (label: string) => {
    const index = Math.random() < 0.5 ? rightBlockCount-1 : 0
    if (label === "PG") {
      if(index==rightBlockCount-1){
        let cont = 0;
        for(let i = index; i >= 0; i--){
          setMassa(alphabet[i+1], numeroInicial * (razao ** (cont++)));
        }
      }
      if(index==0){
        let cont = 0;
        for(let i = index; i <= rightBlockCount; i++){
          setMassa(alphabet[i+1], numeroInicial * (razao ** (cont++)));
        }
      }
    }
    if (label === "PA") {
      if(index==rightBlockCount-1){
        let cont = 0;
        for(let i = index; i >= 0; i--){
          setMassa(alphabet[i+1], numeroInicial + (razao * (cont++)));
        }
      }
      if(index==0){
        let cont = 0;
        for(let i = index; i <= rightBlockCount; i++){
          setMassa(alphabet[i+1], numeroInicial + (razao * (cont++)));
        }
      }
    }
    if (label === "AR") {
      for(let i = 0; i < rightBlockCount; i++) {
        setMassa(alphabet[i+1], Math.floor(Math.random() * (maior - menor + 1)) + menor)
      }
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-0lg shadow-xl p-6 w-80">
        <h2 className="text-xl font-bold mb-4">{label}</h2>

        {(label === "PA" || label === "PG") && (
          <>
            <label className="block text-sm mb-1">Número Inicial:</label>
            <input
              type="number"
              className="border rounded w-full px-2 py-1 mb-4"
              onChange={(e) => setNumeroInicial(Number(e.target.value))}
            />

            <label className="block text-sm mb-1">Razão:</label>
            <input
              type="number"
              step="0.01"
              className="border rounded w-full px-2 py-1 mb-4"
              onChange={(e) => setRazao(Number(e.target.value))}
            />
          </>
        )}

        {label === "AR" && (
          <>
            <label className="block text-sm mb-1">
              Defina os limites dos valores das massas:
            </label>
            <label className="block text-sm mb-1">Menor valor:</label>
            <input
              type="number"
              className="border rounded w-full px-2 py-1 mb-4"
              onChange={(e) => setMenor(Number(e.target.value))}
            />

            <label className="block text-sm mb-1">Maior valor:</label>
            <input
              type="number"
              step="0.01"
              className="border rounded w-full px-2 py-1 mb-4"
              onChange={(e) => setMaior(Number(e.target.value))}
            />
          </>
        )}

        <button
          onClick={() => {
            setMassasDeAcordoComSistema(label);
            onClose();
          }}
          className="w-full bg-blue-400 text-white rounded py-2"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
