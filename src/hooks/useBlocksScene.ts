import { RefObject } from "react";
import {
  Engine,
  Render,
  Runner,
  Bodies,
  Composite,
  Events,
  Body,
  Mouse,
  MouseConstraint,
} from "matter-js";
import { useEffect, useRef } from "react";
import { Collision } from "@/types/collision";


//função para desenhar os nomes dos blocos em seus centros
const nameBlocks = (
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number,
  blockName: string,
) => {
  ctx.font = "bold 30px Arial";
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(blockName, positionX, positionY);
};

export const useBlocksScene = (
  sceneRef: RefObject<HTMLDivElement | null>,
  onBlockClickOpenConfiguration: (body: Matter.Body) => void,
  onCollisionsUpdate: (collisions: Collision[]) => void,
  system1BlocksCount: number,
) => {
  const forcaRef = useRef(false);
  const allBoxesRef = useRef<Body[]>([]);
  const allCollisions = useRef<Collision[]>([]);
  const onCollisionsUpdateRef = useRef(onCollisionsUpdate);
  const renderRef = useRef<Render>(null);
  const mouseConstraintRef = useRef<MouseConstraint>(null);
  const onBlockClickRef = useRef(onBlockClickOpenConfiguration);
  const ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const initialBoxXPosition = 200;
  const initialBoxYPosition = 700;
  const BOX_W_AND_H = 50;
  const forcasEntreBlocks = useRef<Map<string, number>>(new Map());

  const SCALE = 0.002;
  const FORCA_INICIAL = useRef<number>(0);
  const ACELERACAO_SISTEMA = useRef<number>(0);

  //useeffects para atualizar referencias de callbacks fornecidos pelo page
  useEffect(() => {
    onBlockClickRef.current = onBlockClickOpenConfiguration;
  }, [onBlockClickOpenConfiguration]);

  useEffect(() => {
    onCollisionsUpdateRef.current = onCollisionsUpdate;
  }, [onCollisionsUpdate]);

  useEffect(() => {
    if (!sceneRef.current) return;
    //reset de cache de memória em alguns refs para ter certeza que nada seja criado duas vezes
    allBoxesRef.current = [];
    allCollisions.current = [];
    onCollisionsUpdateRef.current([]);

    
    //configurações do matter-js
    const engine = Engine.create();
    const container = sceneRef.current;
    const containerWidth = container.clientWidth || 1100;
    const containerHeight = container.clientHeight || 800;

    //configurações do matter-js
    const render = Render.create({
      element: container,
      engine: engine,
      options: {
        width: containerWidth,
        height: containerHeight,
        wireframes: false,
        background: "#ffffff",
      },
    });
    renderRef.current = render;

    //criação de todos os blocos do sistema baseado no state(do page.tsx) de quantidade de blocos
    for (let i = 0; i < system1BlocksCount; i++) {
      const newBody = Bodies.rectangle(
        i == 0
          ? initialBoxXPosition
          : allBoxesRef.current[i - 1].position.x + 80,
        initialBoxYPosition - 30,
        BOX_W_AND_H,
        BOX_W_AND_H,
        {
          label: ALPHABET[i],
          render: {
            fillStyle: "#FFF",
            strokeStyle: "#000",
            lineWidth: 1,
          },
        },
      );
      Body.setMass(newBody, 10);
      allBoxesRef.current.push(newBody);
    }

    //criação do retangulo preto no sistema 1 que atua como chão
    const ground = Bodies.rectangle(550, 710, 1000, 60, {
      isStatic: true,
      label: "ground",
    });

    //configuração necessária do matter-js
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse });
    mouseConstraintRef.current = mouseConstraint;
    Composite.add(engine.world, mouseConstraint);
    Composite.add(engine.world, [...allBoxesRef.current, ground]);

    //evento apos cada renderização do canvas pra poder desenhar as forças nos blocos
    Events.on(render, "afterRender", () => {
      const ctx = render.context;

      drawForceOnBlock(
        allBoxesRef.current[0].position.x - 100 - BOX_W_AND_H / 2,
        allBoxesRef.current[0].position.y,
        "F",
        100,
        "red",
        false,
        24,
      );

      for (let i = 0; i < system1BlocksCount; i++) {
        nameBlocks(
          ctx,
          allBoxesRef.current[i].position.x,
          allBoxesRef.current[i].position.y,
          allBoxesRef.current[i].label,
        );
      }

      if (forcaRef.current) {
        drawForceOnBlock(
          allBoxesRef.current[0].position.x - BOX_W_AND_H / 2,
          allBoxesRef.current[0].position.y + BOX_W_AND_H / 2,
          "fatr(a)",
          BOX_W_AND_H / 2,
          "green",
          true,
          17,
        );

        for (let i = 0; i < system1BlocksCount; i++) {
          const colisaoExiste = allCollisions.current.find(
            (c) =>
              c.collisionName ===
              `colisao${i == 0 ? "" : ALPHABET[i - 1]}${ALPHABET[i]}`,
          );

          if (colisaoExiste) {
            drawForceOnBlock(
              allBoxesRef.current[i].position.x,
              allBoxesRef.current[i].position.y,
              `F(${allBoxesRef.current[i - 1].label}${allBoxesRef.current[i].label})`,
              BOX_W_AND_H / 2,
              "red",
              false,
              17,
            );
            drawForceOnBlock(
              allBoxesRef.current[i].position.x - BOX_W_AND_H / 2,
              allBoxesRef.current[i].position.y + BOX_W_AND_H / 2,
              `fatr(${allBoxesRef.current[i].label})`,
              BOX_W_AND_H / 2,
              "green",
              true,
              17,
            );
          }
        }
        for (let i = 1; i < system1BlocksCount; i++) {
          const label = `${ALPHABET[i - 1]}${ALPHABET[i]}`;
          const forca = forcasEntreBlocks.current.get(label);
          if (forca !== undefined) {
            const x = allBoxesRef.current[i].position.x;
            const y = allBoxesRef.current[i].position.y - BOX_W_AND_H / 2 - 30;

            ctx.font = "bold 12px Arial";
            ctx.fillStyle = "blue";
            ctx.textAlign = "center";

            // Linha 1: F(ab)
            ctx.fillText(`F(${label})`, x, y);

            // Linha 2: valor da força
            ctx.fillText(`${forca.toFixed(0)}N`, x, y + 15);
          }
        }
      }
    });

    //evento de update a cada frame pra atualizar posições de blocos, velocidades e aceleração
    Events.on(engine, "afterUpdate", () => {
      if (!forcaRef.current) return;
      if (!allBoxesRef.current) return;

        // ✅ Câmera acompanha os blocos
      const xs = allBoxesRef.current.map(b => b.position.x);
      const minX = Math.min(...xs) - 150; // margem à esquerda
      const maxX = Math.max(...xs) + 150; // margem à direita

      Render.lookAt(render, {
        min: { x: minX, y: 0 },
        max: { x: maxX, y: render.options.height! },
      });

      const blocoA = allBoxesRef.current[0];
      let somaAtritos = blocoA.mass * 10 * blocoA.frictionStatic;

      for (let i = 1; i < system1BlocksCount; i++) {
        const blocoAnterior = allBoxesRef.current[i - 1];
        const blocoAtual = allBoxesRef.current[i];

        const nomeColisao = `colisao${blocoAnterior.label}${blocoAtual.label}`;
        const colisaoExiste = allCollisions.current.find(
          (c) => c.collisionName === nomeColisao,
        );

        if (colisaoExiste) {
          somaAtritos += blocoAtual.mass * 10 * blocoAtual.frictionStatic;
        }
      }

      if (FORCA_INICIAL.current <= somaAtritos) {
        for (let i = 0; i < system1BlocksCount; i++) {
          Body.setVelocity(allBoxesRef.current[i], { x: 0, y: 0 });
        }
        return;
      }

      const deltaV = ACELERACAO_SISTEMA.current * SCALE;

      Body.setVelocity(blocoA, {
        x: blocoA.velocity.x + deltaV,
        y: blocoA.velocity.y,
      });
    });

    //evento de colisão de dois blocos pra registrar quais dois blocos colidiram
    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        if (bodyA.label === "ground" || bodyB.label === "ground") return;

        const newCollisionName = `colisao${bodyA.label}${bodyB.label}`;
        const jaExiste = allCollisions.current.find(
          (c) => c.collisionName === newCollisionName,
        );
        if (jaExiste) return;

        const hasCollided = true;
        const newCollision = {
          collisionName: newCollisionName,
          hasCollided: hasCollided,
        };

        allCollisions.current.push(newCollision);
        onCollisionsUpdateRef.current([...allCollisions.current]);
      });
    });

    //evento de clique do mouse pra poder desabilitar ele ao clicar em um bloco
    Events.on(mouseConstraint, "mousedown", (event) => {
      const clickedBody = event.source.body;
      if (clickedBody && !clickedBody.isStatic) {
        onBlockClickRef.current(clickedBody);
      }
    });

    //configurações necessárias do matter-js
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    //configurações necessárias do matter-js
    const observer = new ResizeObserver(() => {
  const w = container.clientWidth;
  const h = container.clientHeight;
  if (w > 0 && h > 0) {
    const dpr = window.devicePixelRatio || 1;

    // Tamanho físico do canvas (pixels reais)
    render.canvas.width = w * dpr;
    render.canvas.height = h * dpr;

    // Tamanho CSS (visual)
    render.canvas.style.width = `${w}px`;
    render.canvas.style.height = `${h}px`;

    // Matter.js usa coordenadas lógicas (sem DPR)
    render.options.width = w;
    render.options.height = h;

    // ✅ Escala o contexto pra compensar o DPR
    render.context.setTransform(dpr, 0, 0, dpr, 0, 0);

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: w, y: h },
    });
  }
});
    observer.observe(container);

    //configurações necessárias do matter-js
    return () => {
      observer.disconnect();
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [system1BlocksCount]);

  //função pra desenhar as flechas das forças nos blocos
  const drawForceOnBlock = (
    positionX: number,
    positionY: number,
    forceText: string,
    arrowSize: number,
    colorArrow: string,
    isReverseArrow: boolean,
    fontSize: number,
  ) => {
    const ctx = renderRef.current!.context;
    const leftSideOfBox = positionX;
    const arrowY = positionY;

    ctx.beginPath();
    ctx.moveTo(leftSideOfBox + arrowSize, arrowY);
    ctx.lineTo(leftSideOfBox, arrowY);
    ctx.strokeStyle = colorArrow;
    ctx.lineWidth = 4;
    ctx.stroke();

    if (!isReverseArrow) {
      ctx.beginPath();
      const newLeftSideofBox = leftSideOfBox + arrowSize;
      ctx.moveTo(newLeftSideofBox + 3, arrowY);
      ctx.lineTo(newLeftSideofBox - 15, arrowY - 10);
      ctx.lineTo(newLeftSideofBox - 15, arrowY + 10);
      ctx.closePath();
      ctx.fillStyle = colorArrow;
      ctx.fill();
    } else {
      ctx.beginPath();
      const newLeftSideOfBox = positionX;
      ctx.moveTo(newLeftSideOfBox - 3, arrowY);
      ctx.lineTo(newLeftSideOfBox + 15, arrowY + 10);
      ctx.lineTo(newLeftSideOfBox + 15, arrowY - 10);
      ctx.closePath();
      ctx.fillStyle = colorArrow;
      ctx.fill();
    }

    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = "black";
    ctx.fillText(forceText, leftSideOfBox + 35, arrowY - 15);
  };

  //função pra resetar a posição de todos os blocos
  const resetPositionOfAllBlocks = () => {
    if (!allBoxesRef.current) return;
    forcaRef.current = false;

    allCollisions.current = [];
    onCollisionsUpdateRef.current([]);
    forcasEntreBlocks.current.clear();

    for (let i = 0; i < system1BlocksCount; i++) {
      const novaPosicaoX = initialBoxXPosition + i * 80;

      const box = allBoxesRef.current[i];

      Body.setVelocity(box, { x: 0, y: 0 });
      Body.setAngularVelocity(box, 0);
      Body.setAngle(box, 0);
      box.force = { x: 0, y: 0 };
      box.torque = 0;

      Body.setPosition(box, { x: novaPosicaoX, y: initialBoxYPosition - 30 });
    }
  };

  //função pra setar o movimento do sistema para verdadeiro
  const applyForce = () => {
    forcaRef.current = true;
  };

  //função pra desativar o mouse
  const disableMouse = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0;
      mouseConstraintRef.current.mouse.button = -1;
    }
  };
  
  //função pra reativar o mouse
  const enableMouse = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0.2;
    }
  };

  //função pra achar a aceleração do sistema
  const findAcceleration = (
    forca_F: number,
    soma_forca_atritos: number,
    soma_massas: number,
  ) => {
    ACELERACAO_SISTEMA.current = (forca_F - soma_forca_atritos) / soma_massas;
    console.log(ACELERACAO_SISTEMA.current);
    return ACELERACAO_SISTEMA.current.toFixed(2);
  };

  //função pra achar a força exercida em um bloco
  const findForceX_Y = (forca_atrito: number, massa: number) => {
    const forcaX_Y =
      -(massa * ACELERACAO_SISTEMA.current) -
      forca_atrito;
    return forcaX_Y.toFixed(2);
  };

  //função pra ajustar a ref da força inicial
  const setForcaInicial = (valor_f: number) => {
    FORCA_INICIAL.current = valor_f;
  };

  //função pra setar a massa de um determinado bloco
  const setMassa = (label: string, massa: number) => {
    const foundBody = allBoxesRef.current.find((box) => box.label === label);
    if (foundBody) {
      Body.setMass(foundBody, massa);
    }
  };

  //função pra pegar todos os blocos existentes
  const getAllBoxes = () => {
    return allBoxesRef.current;
  };

  //função pra pegar a massa de um bloco específico
  const getMassByLabel = (label: string) => {
    if (!allBoxesRef.current) return 0;
    const box = allBoxesRef.current.find((box) => box.label === label);
    if (box) return box.mass;
    return 0;
  };


  //função pra pegar todas as colisões 
  const getAllCollisions = () => {
    if (!allCollisions.current) return [];
    return allCollisions.current;
  };

  //função pra adicionar uma uma nova força entre blocos
  const setForcasEntreBlocos = (label: string, valor: number) => {
    forcasEntreBlocks.current.set(label, valor);
  };

  return {
    resetPositionOfAllBlocks,
    applyForce,
    disableMouse,
    enableMouse,
    findAcceleration,
    setForcaInicial,
    findForceX_Y,
    setMassa,
    getAllBoxes,
    getMassByLabel,
    getAllCollisions,
    setForcasEntreBlocos,
  };
};
