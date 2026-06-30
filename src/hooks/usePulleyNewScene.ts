import { RefObject, useEffect, useRef, useState } from "react";
import {
  Engine,
  Render,
  Runner,
  Bodies,
  Body,
  Composite,
  Events,
} from "matter-js";
import Matter from "matter-js";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const PULLEY_LEFT_X = 320;
const PULLEY_RIGHT_X = 780;
const PULLEY_Y = 100;
const PULLEY_RADIUS = 22;
const LEFT_BLOCK_INITIAL_Y = 300;
const RIGHT_BLOCK_INITIAL_Y = 300;
const LEFT_ROPE_INITIAL_LENGTH = 200;
const RIGHT_ROPE_INITIAL_LENGTH = 200;
const BLOCK_A_X_AND_W = 100;
const BLOCK_RIGHT_X_AND_W = 30;

//função pra desenhar uma força num bloco(as flechas)
const drawForceOnBlock = (
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number,
  forceText: string,
  arrowSize: number,
  arrowHeadSize: number,
  fontSize: number,
  colorArrow: string,
  isReverseArrow: boolean,
) => {
  const arrowX = positionX;

  ctx.beginPath();
  ctx.moveTo(arrowX, positionY);
  ctx.lineTo(arrowX, positionY + (isReverseArrow ? arrowSize : -arrowSize));
  ctx.strokeStyle = colorArrow;
  ctx.lineWidth = 4;
  ctx.stroke();

  if (!isReverseArrow) {
    ctx.beginPath();
    ctx.moveTo(arrowX, positionY - arrowSize);
    ctx.lineTo(
      arrowX - arrowHeadSize,
      positionY - arrowSize + arrowHeadSize * 1.5,
    );
    ctx.lineTo(
      arrowX + arrowHeadSize,
      positionY - arrowSize + arrowHeadSize * 1.5,
    );
    ctx.closePath();
    ctx.fillStyle = colorArrow;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(arrowX, positionY + arrowSize);
    ctx.lineTo(
      arrowX - arrowHeadSize,
      positionY + arrowSize - arrowHeadSize * 1.5,
    );
    ctx.lineTo(
      arrowX + arrowHeadSize,
      positionY + arrowSize - arrowHeadSize * 1.5,
    );
    ctx.closePath();
    ctx.fillStyle = colorArrow;
    ctx.fill();
  }

  ctx.font = `${fontSize}px Arial`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.fillText(
    forceText,
    arrowX,
    positionY + (isReverseArrow ? arrowSize : -arrowSize) - 10,
  );
};

//função pra desenhar as linhas do sistema 2, as que puxam pra cima ou pra baixo
const drawRope = (
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
) => {
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.strokeStyle = "#5a3a1a";
  ctx.lineWidth = 2;
  ctx.stroke();
};

//função pra criar um bloco
const createBlock = (
  block_x_position: number,
  block_y_position: number,
  block_width: number,
  block_height: number,
  block_name: string,
) => {
  return Bodies.rectangle(
    block_x_position,
    block_y_position,
    block_width,
    block_height,
    {
      isStatic: false,
      label: block_name,
      render: { fillStyle: "#FFF", strokeStyle: "#000", lineWidth: 1.5 },
    },
  );
};

//função pra desenhar o nome dos blocos em seus centros
const nameBlocks = (
  ctx: CanvasRenderingContext2D,
  positionX: number,
  positionY: number,
  blockName: string,
  fontSize: number,
) => {
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(blockName, positionX, positionY);
};

export const usePulleyNewScene = (
  sceneRef: RefObject<HTMLDivElement | null>,
  rightBlockCount: number,
  leftBlockMass: number,
  rightBlockMass: number,
  onBlockClick: (body: Body) => void,
) => {
  const renderRef = useRef<Render>(null);
  const leftBlockRef = useRef<Body>(null);
  const rightBlocksRef = useRef<Body[]>(null);
  const massesRef = useRef<number[]>(null);
  const leftRopeLengthRef = useRef<number>(LEFT_ROPE_INITIAL_LENGTH);
  const initialRightRopeLengthRef = useRef<number>(RIGHT_ROPE_INITIAL_LENGTH);
  const remainingRightRopesLengthRef = useRef<number[]>([]);
  const systemAccelerationRef = useRef<number>(0);
  const onBlockClickRef = useRef(onBlockClick);
  const mouseConstraintRef = useRef<Matter.MouseConstraint>(null);

  //useeffect pra lidar com a callback de click em blocos
  useEffect(() => {
    onBlockClickRef.current = onBlockClick;
  }, [onBlockClick]);

  useEffect(() => {
    if (!sceneRef.current) return;
    
    //reset de cache de alguns refs que podem acabar gerando duplicatas
    leftRopeLengthRef.current = LEFT_ROPE_INITIAL_LENGTH;
    initialRightRopeLengthRef.current = RIGHT_ROPE_INITIAL_LENGTH;
    runningRef.current = false;

    //array de nomes dos arrays, é o alfabeto
    const names = Array.from(
      { length: 1 + rightBlockCount },
      (_, i) => ALPHABET[i],
    );

    //configuração necessária do matter-js
    const engine = Engine.create({
      gravity: { x: 0, y: 0 },
    });

    //configuração necessária do matter-js
    const container = sceneRef.current;
    const containerWidth = container.clientWidth || 1100;
    const containerHeight = container.clientHeight || 800;

    //configuração necessária do matter-js
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

    //configuração necessária do matter-js
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, { mouse });
    mouseConstraintRef.current = mouseConstraint;

    // criação do bloco A
    const blockA = createBlock(
      PULLEY_LEFT_X,
      LEFT_BLOCK_INITIAL_Y + BLOCK_A_X_AND_W / 2,
      BLOCK_A_X_AND_W,
      BLOCK_A_X_AND_W,
      "A",
    );
    leftBlockRef.current = blockA;

    // criação dos blocos da direita
    const rightBlocks: Body[] = [];
    for (let i = 0; i < rightBlockCount; i++) {
      if (i === 0) {
        const newBlock = createBlock(
          PULLEY_RIGHT_X,
          RIGHT_BLOCK_INITIAL_Y + BLOCK_RIGHT_X_AND_W / 2,
          BLOCK_RIGHT_X_AND_W,
          BLOCK_RIGHT_X_AND_W,
          names[i + 1],
        );
        Body.setMass(newBlock, rightBlockMass / rightBlockCount);
        rightBlocks.push(newBlock);
      } else {
        const newBlock = createBlock(
          PULLEY_RIGHT_X,
          rightBlocks[i - 1].position.y + 30 + BLOCK_RIGHT_X_AND_W / 2,
          BLOCK_RIGHT_X_AND_W,
          BLOCK_RIGHT_X_AND_W,
          names[i + 1],
        );
        Body.setMass(newBlock, rightBlockMass / rightBlockCount);
        rightBlocks.push(newBlock);
      }
    }
    rightBlocksRef.current = rightBlocks;

    //criação das duas polias e da barra que as conecta
    const pulleyLeft = Bodies.circle(PULLEY_LEFT_X, PULLEY_Y, PULLEY_RADIUS, {
      isStatic: true,
      render: { fillStyle: "#aaa", strokeStyle: "#000", lineWidth: 2 },
    });
    const pulleyRight = Bodies.circle(PULLEY_RIGHT_X, PULLEY_Y, PULLEY_RADIUS, {
      isStatic: true,
      render: { fillStyle: "#aaa", strokeStyle: "#000", lineWidth: 2 },
    });
    const bar = Bodies.rectangle(
      (PULLEY_LEFT_X + PULLEY_RIGHT_X) / 2,
      PULLEY_Y - PULLEY_RADIUS - 5,
      PULLEY_RIGHT_X - PULLEY_LEFT_X,
      10,
      {
        isStatic: true,
        render: { fillStyle: "#555", strokeStyle: "#000", lineWidth: 1 },
      },
    );

    //configuração necessária do matter-js
    Composite.add(engine.world, [
      pulleyLeft,
      pulleyRight,
      bar,
      blockA,
      ...rightBlocks,
      mouseConstraint,
    ]);

    //evento de clique do mouse para poder lidar com ele ser desabilitado e configuração do bloco clicado
    Events.on(mouseConstraint, "mousedown", (event) => {
      const clickedBody = event.source.body;
      if (clickedBody && !clickedBody.isStatic) {
        onBlockClickRef.current(clickedBody);
      }
    });

    //evento apos cada render do canvas pra poder desenhar as forças(flechas) e as linhas(que atuam como as cordas)
    Events.on(render, "afterRender", () => {
      const ctx = render.context;
      if (!leftBlockRef.current) return;
      if (!rightBlocksRef.current) return;
      drawRope(ctx, PULLEY_LEFT_X, PULLEY_Y, PULLEY_RIGHT_X, PULLEY_Y);
      drawRope(
        ctx,
        PULLEY_LEFT_X,
        PULLEY_Y,
        PULLEY_LEFT_X,
        PULLEY_Y + leftRopeLengthRef.current,
      );
      drawRope(
        ctx,
        PULLEY_RIGHT_X,
        PULLEY_Y,
        PULLEY_RIGHT_X,
        PULLEY_Y + initialRightRopeLengthRef.current,
      );
      nameBlocks(ctx, blockA.position.x, blockA.position.y, blockA.label, 40);
      for (let i = 0; i < rightBlockCount; i++) {
        if (i >= 1) {
          drawRope(
            ctx,
            PULLEY_RIGHT_X,
            rightBlocks[i - 1].position.y + BLOCK_RIGHT_X_AND_W / 2,
            PULLEY_RIGHT_X,
            rightBlocks[i].position.y - BLOCK_RIGHT_X_AND_W / 2,
          );
          remainingRightRopesLengthRef.current[i] =
            rightBlocks[i].position.y - BLOCK_RIGHT_X_AND_W / 2;
        }

        nameBlocks(
          ctx,
          rightBlocks[i].position.x,
          rightBlocks[i].position.y,
          rightBlocks[i].label,
          20,
        );
      }

      //Draw forces on A
      drawForceOnBlock(
        ctx,
        PULLEY_LEFT_X,
        leftBlockRef.current.position.y,
        "T(ba)",
        BLOCK_A_X_AND_W,
        10,
        24,
        "red",
        false,
      );
      drawForceOnBlock(
        ctx,
        PULLEY_LEFT_X,
        leftBlockRef.current.position.y,
        "P(a)",
        BLOCK_A_X_AND_W,
        10,
        24,
        "blue",
        true,
      );

      //Draw forces on right blocks
      for (let i = 0; i < rightBlockCount; i++) {
        if (i == 0) {
          drawForceOnBlock(
            ctx,
            PULLEY_RIGHT_X,
            rightBlocksRef.current[i].position.y,
            `T(a${rightBlocksRef.current[i].label})`,
            15,
            5,
            12,
            "red",
            false,
          );
          drawForceOnBlock(
            ctx,
            PULLEY_RIGHT_X,
            rightBlocksRef.current[i].position.y,
            `T(bc) + P(b)`,
            15,
            5,
            12,
            "green",
            true,
          );
        } else {
          drawForceOnBlock(
            ctx,
            PULLEY_RIGHT_X,
            rightBlocksRef.current[i].position.y,
            `T(${rightBlocksRef.current[i - 1].label}${rightBlocksRef.current[i].label})`,
            15,
            5,
            12,
            "red",
            false,
          );
          drawForceOnBlock(
            ctx,
            PULLEY_RIGHT_X,
            rightBlocksRef.current[i].position.y,
            i == rightBlockCount - 1
              ? `P(${rightBlocksRef.current[i].label})`
              : `T(${rightBlocksRef.current[i].label}${rightBlocksRef.current[i + 1].label}) + P(${rightBlocksRef.current[i].label})`,
            15,
            5,
            12,
            "green",
            true,
          );
        }
      }
    });

    //configuração do matter-js
    Render.run(render);
    renderRef.current = render;
    const runner = Runner.create();
    Runner.run(runner, engine);

    //configuração necessária do matter-js
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

    //configuração necessária do matter-js
    return () => {
      observer.disconnect();
      Render.stop(render);
      Runner.stop(runner);
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [rightBlockCount]);

  //reset do sistema pra evitar algum resto de memória
  const runningRef = useRef(false);

  //função pra iniciar o movimento do sistema
  const startForce = () => {
    if (runningRef.current) return;
    runningRef.current = true;

    const massaEsquerda = leftBlockRef.current?.mass ?? leftBlockMass;
    const massaDireita =
      rightBlocksRef.current?.reduce((acc, b) => acc + b.mass, 0) ??
      rightBlockMass;

    if (massaEsquerda == massaDireita) return;

    let direction = "";
    if (massaEsquerda < massaDireita) {
      direction = "left";
    } else {
      direction = "right";
    }

    const loop = () => {
      if (!runningRef.current) return;

      const aceleracao = Math.abs(getAcceleration());

      const SCALE_MIN = 0.2;
      const SCALE_MAX = 3;
      const digit = SCALE_MIN + (aceleracao / 10) * (SCALE_MAX - SCALE_MIN);

      if (direction === "left") {
        leftRopeLengthRef.current -= digit;
        initialRightRopeLengthRef.current += digit;

        if (leftRopeLengthRef.current <= PULLEY_RADIUS) {
          leftRopeLengthRef.current = PULLEY_RADIUS;
          runningRef.current = false;
          return;
        }
      }

      if (direction === "right") {
        leftRopeLengthRef.current += digit;
        initialRightRopeLengthRef.current -= digit;

        if (initialRightRopeLengthRef.current <= PULLEY_RADIUS) {
          initialRightRopeLengthRef.current = PULLEY_RADIUS;
          runningRef.current = false;
          return;
        }
      }

      if (leftBlockRef.current) {
        Body.setPosition(leftBlockRef.current, {
          x: PULLEY_LEFT_X,
          y: PULLEY_Y + leftRopeLengthRef.current + BLOCK_A_X_AND_W / 2,
        });
      }

      if (rightBlocksRef.current) {
        for (let i = 0; i < rightBlockCount; i++) {
          if (i == 0) {
            Body.setPosition(rightBlocksRef.current[i], {
              x: PULLEY_RIGHT_X,
              y:
                PULLEY_Y +
                initialRightRopeLengthRef.current +
                BLOCK_RIGHT_X_AND_W / 2,
            });
          } else {
            Body.setPosition(rightBlocksRef.current[i], {
              x: PULLEY_RIGHT_X,
              y:
                rightBlocksRef.current[i - 1].position.y +
                BLOCK_RIGHT_X_AND_W +
                BLOCK_RIGHT_X_AND_W / 2,
            });
          }
        }
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  };

  //função pra resetar as posições de todos os blocos e das cordas
  const resetAllPositions = () => {
    runningRef.current = false;

    leftRopeLengthRef.current = LEFT_ROPE_INITIAL_LENGTH;
    initialRightRopeLengthRef.current = RIGHT_ROPE_INITIAL_LENGTH;

    if (leftBlockRef.current) {
      Body.setPosition(leftBlockRef.current, {
        x: PULLEY_LEFT_X,
        y: PULLEY_Y + LEFT_ROPE_INITIAL_LENGTH + BLOCK_A_X_AND_W / 2,
      });
    }

    if (rightBlocksRef.current) {
      for (let i = 0; i < rightBlockCount; i++) {
        if (i == 0) {
          Body.setPosition(rightBlocksRef.current[i], {
            x: PULLEY_RIGHT_X,
            y: PULLEY_Y + RIGHT_ROPE_INITIAL_LENGTH + BLOCK_RIGHT_X_AND_W / 2,
          });
        } else {
          Body.setPosition(rightBlocksRef.current[i], {
            x: PULLEY_RIGHT_X,
            y:
              rightBlocksRef.current[i - 1].position.y +
              BLOCK_RIGHT_X_AND_W +
              BLOCK_RIGHT_X_AND_W / 2,
          });
        }
      }
    }
  };

  //função pra pegar a aceleração do sistema
  const getAcceleration = () => {
    if (!leftBlockRef.current) return 0;
    if (!rightBlocksRef.current) return 0;
    if (rightBlocksRef.current.length !== rightBlockCount) return 0;
    let somaPesosDireita = 0;
    let somaMassas = 0;
    const pesoA = leftBlockRef.current.mass * 10;
    somaMassas += leftBlockRef.current.mass;
    for (let i = 0; i < rightBlockCount; i++) {
      somaPesosDireita += rightBlocksRef.current[i].mass * 10;
      somaMassas += rightBlocksRef.current[i].mass;
    }

    systemAccelerationRef.current = (pesoA - somaPesosDireita) / somaMassas;

    return systemAccelerationRef.current;
  };

  //função pra setar a massa de um determinado bloco
  const setMassaBloco = (label: string, massa: number) => {
    if (!leftBlockRef.current || !rightBlocksRef.current) return 0;
    if (leftBlockRef.current.label === label) {
      Body.setMass(leftBlockRef.current, massa);
    } else {
      for (let i = 0; i < rightBlockCount; i++) {
        if (rightBlocksRef.current[i].label === label) {
          Body.setMass(rightBlocksRef.current[i], massa);
        }
      }
    }
  };

  //função pra desativar o mouse
  const disableMouse2 = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0;
      mouseConstraintRef.current.mouse.button = -1;
    }
  };

  //função pra ativar o mouse
  const enableMouse2 = () => {
    if (mouseConstraintRef.current) {
      mouseConstraintRef.current.constraint.stiffness = 0.2;
    }
  };

  //função pra pegar todos os blocos como um array para serem manipulados fora do hook
  const getAllBlocksAsArray = () => {
    if (!leftBlockRef.current || !rightBlocksRef.current) return [];
    if (rightBlocksRef.current.length !== rightBlockCount) return [];
    const blocks_array: Body[] = [];
    blocks_array.push(leftBlockRef.current);
    blocks_array.push(...rightBlocksRef.current);
    return blocks_array;
  };

  return {
    resetAllPositions,
    startForce,
    getAllBlocksAsArray,
    getAcceleration,
    enableMouse2,
    disableMouse2,
    setMassaBloco,
  };
};
