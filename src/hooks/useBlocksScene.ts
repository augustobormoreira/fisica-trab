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
  ctx.font = "bold 40px Arial";
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
    onCollisionsUpdateRef.current = onCollisionsUpdate
  }, [onCollisionsUpdate]);

  useEffect(() => {
    if (!sceneRef.current) return;
    allBoxesRef.current = [];

    const engine = Engine.create();

    const render = Render.create({
      element: sceneRef!.current,
      engine: engine,
      options: {
        width: 1100,
        height: 800,
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

    const ground = Bodies.rectangle(550, 710, 1000, 60, { isStatic: true, label: "ground" });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse });
    mouseConstraintRef.current = mouseConstraint;
    Composite.add(engine.world, mouseConstraint);
    Composite.add(engine.world, [...allBoxesRef.current, ground]);

    Events.on(render, "afterRender", () => {
      const ctx = render.context;
      nameBlocks(ctx, boxA.position.x, boxA.position.y, "A");
      nameBlocks(ctx, boxB.position.x, boxB.position.y, "B");
      nameBlocks(ctx, boxC.position.x, boxC.position.y, "C");

      drawForceOnBlock(
        allBoxesRef.current[0].position.x - 100 - BOX_W_AND_H / 2,
        allBoxesRef.current[0].position.y,
        "F",
        100,
        "red",
        false,
        24,
      );

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
              `F(${allBoxesRef.current[i-1].label}${allBoxesRef.current[i].label})`,
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
      }
    });

    Events.on(engine, "afterUpdate", () => {
      if (!forcaRef.current) return;
      if (!allBoxesRef.current) return;

      // Usar massas REAIS para calcular atrito estático
      let somaAtritos = 0;
      for (let i = 0; i < system1BlocksCount; i++) {
        const colisaoExiste = allCollisions.current.find(
          (c) =>
            c.collisionName ===
            `colisao${i == 0 ? "" : ALPHABET[i - 1]}${ALPHABET[i]}`,
        );
        somaAtritos += colisaoExiste
          ? allBoxesRef.current[i].mass *
            10 *
            allBoxesRef.current[i].frictionStatic
          : 0;
      }
      /*const Fae_A = findStaticFrictionForce(
        massaRealA.current,
        boxARef.current.frictionStatic,
      );
      const Fae_B = findStaticFrictionForce(
        massaRealB.current,
        boxBRef.current.frictionStatic,
      );
      const Fae_C = findStaticFrictionForce(
        massaRealC.current,
        boxCRef.current.frictionStatic,
      );

      // Só soma atrito de B e C se já colidiu
      /*const somaAtritos =
        Fae_A +
        (colisaoABRef.current ? Fae_B : 0) +
        (colisaoBCRef.current ? Fae_C : 0);
*/
      if (FORCA_INICIAL.current <= somaAtritos) {
        for (let i = 0; i < system1BlocksCount; i++) {
          Body.setVelocity(allBoxesRef.current[i], { x: 0, y: 0 });
        }
        return; // ← return faltava aqui
      }

      const deltaV = ACELERACAO_SISTEMA.current * SCALE;

      Body.setVelocity(allBoxesRef.current[0], {
        x: allBoxesRef.current[0].velocity.x + deltaV,
        y: allBoxesRef.current[0].velocity.y,
      });
    });

    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {     
        const { bodyA, bodyB } = pair;

        if(bodyA.label === "ground" || bodyB.label === "ground") return;

        const newCollisionName = `colisao${bodyA.label}${bodyB.label}`;
        const jaExiste = allCollisions.current.find(c => c.collisionName === newCollisionName);
        if(jaExiste) return;

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

    return () => {
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

    for (let i = 0; i < system1BlocksCount; i++) {
      if(allCollisions.current[i]) allCollisions.current[i].hasCollided = false;
      resetPosition(
        allBoxesRef.current[i],
        i == 0
          ? initialBoxXPosition
          : allBoxesRef.current[i - 1].position.x + 80,
      );
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

  const findStaticFrictionForce = (
    massa: number,
    coeficiente_atr_estatico: number,
  ) => {
    return massa * 10 * coeficiente_atr_estatico;
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
    return allBoxesRef.current
  }

  const getMassByLabel = (label: string) => {
    if(!allBoxesRef.current) return 0;
    const box = allBoxesRef.current.find(box => box.label === label)
    if(box) return box.mass;
    return 0;
  } 

  const getAllCollisions = () => {
    if(!allCollisions.current) return [];
    return allCollisions.current;
  }

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
    setMassaReal,
    getMassaReal,
    massaRealA,
    massaRealB,
    massaRealC,
    getAllBoxes,
    getMassByLabel,
    getAllCollisions,
  };
};
