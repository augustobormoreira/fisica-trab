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

const boxSettings = [
  { positionX: 200, positionY: 700, width: 200, height: 200 },
  { positionX: 550, positionY: 700, width: 100, height: 100 },
  { positionX: 670, positionY: 700, width: 50, height: 50 },
];

const ALPHABET = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

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
  const boxARef = useRef<Body>(null);
  const boxBRef = useRef<Body>(null);
  const boxCRef = useRef<Body>(null);
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

  const massaRealA = useRef<number>(40);
  const massaRealB = useRef<number>(10);
  const massaRealC = useRef<number>(90);

  const SCALE = 0.002;
  const FORCA_INICIAL = useRef<number>(0);
  const ACELERACAO_SISTEMA = useRef<number>(0);
  const FORCA_A_EM_B = useRef<number>(0);
  const FORCA_B_EM_C = useRef<number>(0);
  const FORCA_ATR_A = useRef<number>(0);
  const FORCA_ATR_B = useRef<number>(0);
  const FORCA_ATR_C = useRef<number>(0);

  useEffect(() => {
    onBlockClickRef.current = onBlockClickOpenConfiguration;
  }, [onBlockClickOpenConfiguration]);

  useEffect(() => {
    onCollisionsUpdateRef.current = onCollisionsUpdate;
  }, [onCollisionsUpdate]);

  useEffect(() => {
    if (!sceneRef.current) return;
    allBoxesRef.current = [];
    allCollisions.current = [];
    onCollisionsUpdateRef.current([]);

    const engine = Engine.create();

    const container = sceneRef.current;
    const containerWidth = container.clientWidth || 1100;
    const containerHeight = container.clientHeight || 800;

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

    const boxA = Bodies.rectangle(
      boxSettings[0].positionX,
      boxSettings[0].positionY,
      boxSettings[0].width,
      boxSettings[0].height,
      {
        label: "A",
        render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 },
      },
    );
    const boxB = Bodies.rectangle(
      boxSettings[1].positionX,
      boxSettings[1].positionY,
      boxSettings[1].width,
      boxSettings[1].height,
      {
        label: "B",
        render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 },
      },
    );
    const boxC = Bodies.rectangle(
      boxSettings[2].positionX,
      boxSettings[2].positionY,
      boxSettings[2].width,
      boxSettings[2].height,
      {
        label: "C",
        render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 },
      },
    );

    boxARef.current = boxA;
    boxBRef.current = boxB;
    boxCRef.current = boxC;

    const ground = Bodies.rectangle(550, 710, 1000, 60, {
      isStatic: true,
      label: "ground",
    });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse });
    mouseConstraintRef.current = mouseConstraint;
    Composite.add(engine.world, mouseConstraint);
    Composite.add(engine.world, [...allBoxesRef.current, ground]);

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

    Events.on(engine, "afterUpdate", () => {
      if (!forcaRef.current) return;
      if (!allBoxesRef.current) return;

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

    Events.on(mouseConstraint, "mousedown", (event) => {
      const clickedBody = event.source.body;
      if (clickedBody && !clickedBody.isStatic) {
        onBlockClickRef.current(clickedBody);
      }
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    const observer = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        const dpr = window.devicePixelRatio || 1;
        render.canvas.width = w * dpr;
        render.canvas.height = h * dpr;
        render.canvas.style.width = `${w}px`;
        render.canvas.style.height = `${h}px`;
        render.options.width = w;
        render.options.height = h;
        Render.lookAt(render, {
          min: { x: 0, y: 0 },
          max: { x: w, y: h },
        });
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [system1BlocksCount]);

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

  const resetPositionOfAllBlocks = () => {
    if (!allBoxesRef.current) return;
    forcaRef.current = false;

    allCollisions.current = [];
    onCollisionsUpdateRef.current([]);

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

  const resetPosition = (boxRef: Body, x_position: number) => {
    Body.setVelocity(boxRef, { x: 0, y: 0 });
    Body.setAngularVelocity(boxRef, 0);
    Body.setPosition(boxRef, { x: x_position, y: 700 });
  };

  const applyForce = () => {
    forcaRef.current = true;
  };

  const disableMouse = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0;
      mouseConstraintRef.current.mouse.button = -1;
    }
  };

  const enableMouse = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0.2;
    }
  };

  // Usa massa REAL para calcular atrito para exibição no painel
  const findFrictionForce = (
    block_name: string,
    coeficiente_atr: number,
    _forca_peso: number, // ignorado — usamos massa real * g
  ) => {
    if (block_name === "A") {
      FORCA_ATR_A.current = coeficiente_atr * massaRealA.current * 10;
      return FORCA_ATR_A.current;
    }
    if (block_name === "B") {
      FORCA_ATR_B.current = coeficiente_atr * massaRealB.current * 10;
      return FORCA_ATR_B.current;
    }
    if (block_name === "C") {
      FORCA_ATR_C.current = coeficiente_atr * massaRealC.current * 10;
      return FORCA_ATR_C.current;
    }
    return coeficiente_atr * 10;
  };

  const findAcceleration = (
    forca_F: number,
    soma_forca_atritos: number,
    soma_massas: number,
  ) => {
    ACELERACAO_SISTEMA.current = (forca_F - soma_forca_atritos) / soma_massas;
    return ACELERACAO_SISTEMA.current.toFixed(2);
  };

  const findForceA_B = (forca_atrito: number, massa: number) => {
    FORCA_A_EM_B.current =
      -(massa * ACELERACAO_SISTEMA.current) +
      FORCA_INICIAL.current -
      forca_atrito;
    return FORCA_A_EM_B.current.toFixed(2);
  };

  const findForceB_C = (forca_atrito: number, massa: number) => {
    FORCA_B_EM_C.current =
      -(massa * ACELERACAO_SISTEMA.current) +
      FORCA_A_EM_B.current -
      forca_atrito;
    return FORCA_B_EM_C.current.toFixed(2);
  };

  const setForcaInicial = (valor_f: number) => {
    FORCA_INICIAL.current = valor_f;
  };

  const setMassa = (label: string, massa: number) => {
    const foundBody = allBoxesRef.current.find((box) => box.label === label);
    if (foundBody) {
      Body.setMass(foundBody, massa);
    }
  };

  // Setter para o BlockModal atualizar a massa real
  const setMassaReal = (label: string, valor: number) => {
    if (label === "A") massaRealA.current = valor;
    if (label === "B") massaRealB.current = valor;
    if (label === "C") massaRealC.current = valor;
  };

  const getMassaReal = (label: string) => {
    if (label === "A") return massaRealA.current;
    if (label === "B") return massaRealB.current;
    if (label === "C") return massaRealC.current;
    return 0;
  };

  const getBlocksAsArray = () => {
    return [boxARef, boxBRef, boxCRef];
  };

  const getAllBoxes = () => {
    return allBoxesRef.current;
  };

  const getMassByLabel = (label: string) => {
    if (!allBoxesRef.current) return 0;
    const box = allBoxesRef.current.find((box) => box.label === label);
    if (box) return box.mass;
    return 0;
  };

  const getAllCollisions = () => {
    if (!allCollisions.current) return [];
    return allCollisions.current;
  };

  const setForcasEntreBlocos = (label: string, valor: number) => {
    forcasEntreBlocks.current.set(label, valor);
  };

  return {
    resetPositionOfAllBlocks,
    applyForce,
    getBlocksAsArray,
    disableMouse,
    enableMouse,
    findAcceleration,
    findFrictionForce,
    setForcaInicial,
    findForceA_B,
    findForceB_C,
    setMassa,
    getMassaReal,
    massaRealA,
    massaRealB,
    massaRealC,
    getAllBoxes,
    getMassByLabel,
    getAllCollisions,
    setForcasEntreBlocos,
  };
};
