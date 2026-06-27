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

const boxSettings = [
  { positionX: 200, positionY: 700, width: 200, height: 200 },
  { positionX: 550, positionY: 700, width: 100, height: 100 },
  { positionX: 670, positionY: 700, width: 50,  height: 50  },
];

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
  onColisaoAB: () => void,
  onColisaoBC: () => void,
) => {
  const forcaRef = useRef(false);
  const boxARef = useRef<Body>(null);
  const boxBRef = useRef<Body>(null);
  const boxCRef = useRef<Body>(null);
  const renderRef = useRef<Render>(null);
  const colisaoABRef = useRef(false);
  const colisaoBCRef = useRef(false);
  const onColisaoABRef = useRef(onColisaoAB);
  const onColisaoBCRef = useRef(onColisaoBC);
  const mouseConstraintRef = useRef<MouseConstraint>(null);
  const onBlockClickRef = useRef(onBlockClickOpenConfiguration);

  // Massas reais em kg (separadas da massa interna do Matter.js)
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
    onColisaoABRef.current = onColisaoAB;
    onColisaoBCRef.current = onColisaoBC;
  }, [onColisaoAB, onColisaoBC]);

  useEffect(() => {
    if (!sceneRef.current) return;

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

    const boxA = Bodies.rectangle(
      boxSettings[0].positionX, boxSettings[0].positionY,
      boxSettings[0].width, boxSettings[0].height,
      { label: "A", render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 } },
    );
    const boxB = Bodies.rectangle(
      boxSettings[1].positionX, boxSettings[1].positionY,
      boxSettings[1].width, boxSettings[1].height,
      { label: "B", render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 } },
    );
    const boxC = Bodies.rectangle(
      boxSettings[2].positionX, boxSettings[2].positionY,
      boxSettings[2].width, boxSettings[2].height,
      { label: "C", render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1 } },
    );

    boxARef.current = boxA;
    boxBRef.current = boxB;
    boxCRef.current = boxC;

    const ground = Bodies.rectangle(550, 710, 1000, 60, { isStatic: true });

    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, { mouse });
    mouseConstraintRef.current = mouseConstraint;
    Composite.add(engine.world, mouseConstraint);
    Composite.add(engine.world, [boxA, boxB, boxC, ground]);

    Events.on(render, "afterRender", () => {
      const ctx = render.context;
      nameBlocks(ctx, boxA.position.x, boxA.position.y, "A");
      nameBlocks(ctx, boxB.position.x, boxB.position.y, "B");
      nameBlocks(ctx, boxC.position.x, boxC.position.y, "C");

      drawForceOnBlock(
        boxA.position.x, boxA.position.y,
        boxSettings[0].width, "F", boxSettings[0].width, "red", false,
      );

      if (forcaRef.current) {
        if (colisaoABRef.current) {
          drawForceOnBlock(
            boxB.position.x, boxB.position.y,
            boxSettings[1].width, "Fab", boxSettings[1].width, "red", false,
          );
          drawForceOnBlock(
            boxA.position.x - boxSettings[1].width, boxA.position.y,
            boxSettings[1].width, "Fba", boxSettings[1].width, "blue", true,
          );
          drawForceOnBlock(
            boxB.position.x - boxSettings[1].width / 2,
            boxB.position.y + boxSettings[1].height / 2,
            boxSettings[1].width, "atr b", boxSettings[1].width / 2, "green", true,
          );
        }

        if (colisaoBCRef.current) {
          drawForceOnBlock(
            boxC.position.x, boxC.position.y,
            boxSettings[2].width, "Fbc", boxSettings[2].width, "red", false,
          );
          drawForceOnBlock(
            boxB.position.x - boxSettings[2].width, boxB.position.y,
            boxSettings[2].width, "Fcb", boxSettings[2].width, "blue", true,
          );
          drawForceOnBlock(
            boxC.position.x - boxSettings[2].width / 2,
            boxC.position.y + boxSettings[2].height / 2,
            boxSettings[2].width, "atr c", boxSettings[2].width / 2, "green", true,
          );
        }

        drawForceOnBlock(
          boxA.position.x - boxSettings[0].width / 2,
          boxA.position.y + boxSettings[0].height / 2,
          boxSettings[0].width, "atr a", boxSettings[0].width / 2, "green", true,
        );
      }
    });

    Events.on(engine, "afterUpdate", () => {
      if (!forcaRef.current) return;
      if (!boxARef.current || !boxBRef.current || !boxCRef.current) return;

      // Usar massas REAIS para calcular atrito estático
      const Fae_A = findStaticFrictionForce(massaRealA.current, boxARef.current.frictionStatic);
      const Fae_B = findStaticFrictionForce(massaRealB.current, boxBRef.current.frictionStatic);
      const Fae_C = findStaticFrictionForce(massaRealC.current, boxCRef.current.frictionStatic);

      // Só soma atrito de B e C se já colidiu
      const somaAtritos = Fae_A
        + (colisaoABRef.current ? Fae_B : 0)
        + (colisaoBCRef.current ? Fae_C : 0);

      if (FORCA_INICIAL.current <= somaAtritos) {
        Body.setVelocity(boxARef.current, { x: 0, y: 0 });
        Body.setVelocity(boxBRef.current, { x: 0, y: 0 });
        Body.setVelocity(boxCRef.current, { x: 0, y: 0 });
        return; // ← return faltava aqui
      }

      const deltaV = ACELERACAO_SISTEMA.current * SCALE;

      Body.setVelocity(boxARef.current, {
        x: boxARef.current.velocity.x + deltaV,
        y: boxARef.current.velocity.y,
      });
    });

    Events.on(engine, "collisionStart", (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;

        const colisaoAB =
          (bodyA === boxA && bodyB === boxB) ||
          (bodyA === boxB && bodyB === boxA);
        const colisaoBC =
          (bodyA === boxB && bodyB === boxC) ||
          (bodyA === boxC && bodyB === boxB);

        if (colisaoAB && !colisaoABRef.current) {
          colisaoABRef.current = true;
          onColisaoABRef.current?.();
        }
        if (colisaoBC && !colisaoBCRef.current) {
          colisaoBCRef.current = true;
          onColisaoBCRef.current?.();
        }
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
  }, []);

  const drawForceOnBlock = (
    positionX: number,
    positionY: number,
    boxWidth: number,
    forceText: string,
    arrowSize: number,
    colorArrow: string,
    isReverseArrow: boolean,
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

    ctx.font = "24px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(forceText, leftSideOfBox + 35, arrowY - 15);
  };

  const resetPositionOfAllBlocks = () => {
    forcaRef.current = false;
    colisaoABRef.current = false;
    colisaoBCRef.current = false;
    resetPosition(boxARef.current!, boxSettings[0].positionX);
    resetPosition(boxBRef.current!, boxSettings[1].positionX);
    resetPosition(boxCRef.current!, boxSettings[2].positionX);
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

  const findStaticFrictionForce = (massa: number, coeficiente_atr_estatico: number) => {
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
      -(massa * ACELERACAO_SISTEMA.current) + FORCA_INICIAL.current - forca_atrito;
    return FORCA_A_EM_B.current.toFixed(2);
  };

  const findForceB_C = (forca_atrito: number, massa: number) => {
    FORCA_B_EM_C.current =
      -(massa * ACELERACAO_SISTEMA.current) + FORCA_A_EM_B.current - forca_atrito;
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
  };
};