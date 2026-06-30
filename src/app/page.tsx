"use client";
/* Imports necessários do Matter-JS e do react */
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
  const sceneRef1 = useRef<HTMLDivElement>(null); //referencia pro canvas do sistema 1
  const sceneRef2 = useRef<HTMLDivElement>(null); //referencia pro canvas do sistema 2
  const [selectedBody, setSelectedBody] = useState<Matter.Body | null>(null); //state do bloco que vai ser clicado no sistema 1
  const [selectedBody2, setSelectedBody2] = useState<Matter.Body | null>(null); //state do bloco que vai ser clicado no sistema 2
  const [startSystem, setStartSystem] = useState<boolean>(false); //state de true/false pra declarar se o sistema ta em movimento ou nao
  const [systemReset, setSystemReset] = useState<boolean>(false); //state de true/false pra declarar se o sistema deve ser resetado ou nao
  const [selectedAlternateOption, setSelectedAlternateOption] = useState<
    string | null
  >(null); ///state de string da opcao que o usuario clicar no botao do management panel
  const [rightBlockCount, setRightBlockCount] = useState<number>(2); //state pra controlar a quantidade de blocos na direita do sistema 2
  const [sistemaAtivo, setSistemaAtivo] = useState<Sistema>("sistema1"); //state pra controlar o sistema ativo(1 ou 2)
  const [blocks, setBlocks] = useState<Matter.Body[]>([]); //state de acesso pra controlar os blocos do sistema 1
  const [blocksS2, setBlocksS2] = useState<Matter.Body[]>([]); //state de acesso pra controlar os blocos do sistema 2
  const [collisions, setCollisions] = useState<Collision[]>([]); //state de acesso pra ter informações sobre as colisoes de blocos do sistema 1
  const [system1BlockCount, setSystem1BlockCount] = useState<number>(7); //state de controle da quantidade de blocos do sistema 1

  //hook usecallback pra executar a função que vai setar o corpo selectedBody que o usuario clicar
  //e também desativa o mouse pq o matter-js tem um comportamento que ao clicar no bloco vc pode arrastar ele pelo canvas
  const handleBlockClick = useCallback((body: Matter.Body) => {
    setSelectedBody(body);
    disableMouse();
  }, []);

  //aqui é criado o sistema1 com o hook customizado chamado useBlocksScene
  //usando o destructuring para pegar os retornos necessários do hook
  //ele recebe como parametro a referencia da div do sistema1, a callback pra lidar com o click do bloco o set do bloco ativo,
  //o set de colisoes para a gente poder ter acesso as colisoes e saber qual bloco colidiu
  //e por ultimo a quantidade de blocos que deve ser criada
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
    setForcasEntreBlocos,
  } = useBlocksScene(
    sceneRef1,
    handleBlockClick,
    (newCollisions) => setCollisions([...newCollisions]),
    system1BlockCount,
  );

  //função pra lidar com a pessoa clicando em um botao do management panel tipo "PA", "PG", "AR"
  //essa função é enviada pro management panel ao invés do set do hook
  const setAlternateOption = (alternateOption: string) => {
    setSelectedAlternateOption(alternateOption);
  };

  //Aqui é criado o sistema 2, com o hook customizado chamado usePulleyNewScene
  //É feito o destructuring para pegar as funções necessárias pra manipular o sistema 2
  //Ele recebe como parametro a referencia da div do sistema 2, a qtd de blocos da direita
  //a massa do bloco da esquerda, e a soma dos blocos da direita, além disso ele recebe uma callback
  //pra lidar com o click nos blocos do sistema 2 e a função pra desativar o mouse tbm pra evitar que os blocos se arrastem
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

  //use effect pra poder alterar escutar a mudança na quantidade de blocos e pra poder alterar eles na dom
  useEffect(() => {
    setBlocks(getAllBoxes());
  }, [system1BlockCount]);
  useEffect(() => {
    const blocks = getAllBlocksAsArray();
    if (blocks.length > 0) {
      setBlocksS2(blocks);
    }
  }, [rightBlockCount]);

  //função pra lidar com o click do botao reset do sistema 1, ele redefine a posição dos blocos
  //zera o numero de colisoes, torna falso o "start" do sistema e inverte o valor booleano do systemreset
  const handleReset = () => {
    resetPositionOfAllBlocks();
    setCollisions([]);
    setStartSystem(false);
    setSystemReset((prev) => !prev);
  };

  return (
    <div className="w-full h-full flex flex-row overflow-hidden">
      <div className="w-1/5 shrink-0 h-full border-l border-gray-300 flex flex-col items-start pt-4 px-4 gap-2 overflow-y-auto min-w-0">
        {/* criação do componente managementpanel que fica na esquerda, ele configura o sistema
        recebe todas as funções necessárias pra configurar os dois sistemas */}
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

      {/* Aqui a gente carrega o sistema dependendo do sistema ativo
          No management panel o usuario pode selecionar o sistema que ele quer
          As duas divs são carregas mas a que não for selecionada fica hidden */}
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

      {/* Essa parte é o painel da direita, onde é exibido as informações do sistema que deve ser exibido
              É controlado usando o state do sistemaAtivo, se for o sistema 1 carrega o SystemOnePanel
              Se for o sistema2 carrega o SystemTwoPanel */}
      <div className="w-1/5 shrink-0 h-full border-l border-gray-300 flex flex-col items-start pt-4 px-4 gap-2 overflow-y-auto min-w-0">
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
            setForcasEntreBlocos={setForcasEntreBlocos}
          />
        )}

        {sistemaAtivo === "sistema2" && (
          <SystemTwoPanel blocks={blocksS2} getAcceleration={getAcceleration} />
        )}
      </div>

      {/* Modal de configuração dos blocos do sistema 1, apenas carrega se o state selectedBody existir */}
      {selectedBody && (
        <BlockModal
          system={sistemaAtivo}
          body={selectedBody}
          onSave={(label, massaReal) => setMassa(label, massaReal)}
          onClose={() => {
            setSelectedBody(null);
            enableMouse2();
          }}
          massa={selectedBody.mass}
        />
      )}

      {/* Modal de configuração dos blocos do sistema 2, apenas carrega se o state selectedBody2 existir */}
      {selectedBody2 && (
        <BlockModal
          system={sistemaAtivo}
          body={selectedBody2}
          onClose={() => {
            setSelectedBody2(null);
            enableMouse();
          }}
          massa={selectedBody2.mass}
        />
      )}
      {/* Modal de configuração das opções do management panel, ou seja se o usuario clicou em "PA", "PG" ou "Randomizar" */}
      {selectedAlternateOption && (
        <AlternateOptions
          label={selectedAlternateOption}
          onClose={() => setSelectedAlternateOption(null)}
          setMassa={sistemaAtivo == "sistema1" ? setMassa : setMassaBloco}
          system={sistemaAtivo}
          rightBlockCount={
            sistemaAtivo == "sistema1" ? system1BlockCount : rightBlockCount
          }
        />
      )}
    </div>
  );
}
