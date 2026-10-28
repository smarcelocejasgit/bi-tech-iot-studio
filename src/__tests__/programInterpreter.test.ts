import { describe, expect, it } from 'vitest';
import {
  describeCondition,
  formatActionsList,
  interpretProgram,
} from '../interpreter/programInterpreter';
import { ParsedProgram } from '../types/studio';

describe('Intérprete didáctico narrativo del programa', () => {
  it('muestra el mensaje pedagógico requerido cuando el programa está vacío', () => {
    const result = interpretProgram({
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [],
    });

    expect(result.isEmpty).toBe(true);
    expect(result.narrativeSteps).toEqual([]);
    expect(result.summarySentence).toBe(
      'Tu programa todavía no tiene instrucciones. Agregá bloques para comenzar a construir y después vas a poder leer aquí, paso a paso, qué hace tu algoritmo.'
    );
  });

  it('narra en orden lectura, decisión, ramas y acciones dentro del ciclo', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      startBlockId: 'start',
      loopBlockId: 'loop',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          blockId: 'if-soil',
          condition: {
            kind: 'comparison',
            blockId: 'sensor-soil',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on', blockId: 'pump-on' }],
          elseBranch: [{ kind: 'bomba_off', blockId: 'pump-off' }],
        },
      ],
    };

    const result = interpretProgram(program);
    const labels = result.narrativeSteps.map((step) => step.blockLabel);

    expect(labels).toEqual([
      'al iniciar',
      'repetir siempre',
      'leer humedad del suelo',
      'si... entonces / si no',
      'rama si',
      'encender bomba',
      'rama si no',
      'apagar bomba',
      'volver a repetir',
    ]);

    const repeatStep = result.narrativeSteps.find(
      (step) => step.kind === 'repeat'
    )!;
    expect(repeatStep.explanation).toContain('crea un ciclo');
    expect(repeatStep.explanation).not.toContain('condición');
    expect(repeatStep.blockId).toBe('loop');

    const readStep = result.narrativeSteps.find(
      (step) => step.kind === 'read'
    )!;
    expect(readStep.explanation).toContain('obtiene un dato de humedad del suelo');

    const conditionStep = result.narrativeSteps.find(
      (step) => step.kind === 'condition'
    )!;
    expect(conditionStep.explanation).toContain('decisión condicional');
    expect(conditionStep.explanation).toContain(
      'humedad del suelo es menor que 30'
    );
    expect(conditionStep.explanation).toContain('rama “si no”');

    expect(result.summarySentence).toBe(
      'Este programa: mide → compara → decide → actúa → vuelve a medir.'
    );
  });

  it('conserva el orden de una secuencia y explica la temporización', () => {
    const result = interpretProgram({
      device: 'garden-node',
      setupStatements: [{ kind: 'bomba_off', blockId: 'safe-off' }],
      loopStatements: [
        { kind: 'bomba_on', blockId: 'pump-on' },
        { kind: 'wait', seconds: 2, blockId: 'wait' },
        { kind: 'bomba_off', blockId: 'pump-off' },
      ],
    });

    expect(result.narrativeSteps.map((step) => step.blockLabel)).toEqual([
      'al iniciar',
      'apagar bomba',
      'repetir siempre',
      'encender bomba',
      'esperar 2 segundo(s)',
      'apagar bomba',
      'volver a repetir',
    ]);
    expect(
      result.narrativeSteps.find((step) => step.kind === 'wait')?.explanation
    ).toContain('pausa la secuencia durante 2 segundo(s)');
    expect(result.summarySentence).toBe(
      'Este programa: actúa → espera → repite.'
    );
  });

  it('representa decisiones anidadas con mayor profundidad que su rama contenedora', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          blockId: 'outer-if',
          condition: {
            kind: 'comparison',
            leftSensor: 'temperatura',
            operator: '>',
            rightNumber: 28,
          },
          thenBranch: [
            {
              kind: 'if',
              blockId: 'inner-if',
              condition: {
                kind: 'comparison',
                leftSensor: 'humedadSuelo',
                operator: '<',
                rightNumber: 30,
              },
              thenBranch: [{ kind: 'bomba_on', blockId: 'pump' }],
            },
          ],
        },
      ],
    };

    const result = interpretProgram(program);
    const outer = result.narrativeSteps.find(
      (step) => step.blockId === 'outer-if' && step.kind === 'condition'
    )!;
    const inner = result.narrativeSteps.find(
      (step) => step.blockId === 'inner-if' && step.kind === 'condition'
    )!;
    const action = result.narrativeSteps.find(
      (step) => step.blockId === 'pump'
    )!;

    expect(inner.depth).toBeGreaterThan(outer.depth);
    expect(action.depth).toBeGreaterThan(inner.depth);
    expect(inner.explanation).toContain('humedad del suelo es menor que 30');
  });

  it('explica configuración y comunicación de Camera Node sin inventar pasos', () => {
    const result = interpretProgram({
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_resolution', resolution: 'QVGA (320x240)' },
        { kind: 'cam_wifi', ssid: 'Escuela_BiTech' },
        { kind: 'cam_init' },
      ],
      loopStatements: [
        { kind: 'cam_capture' },
        { kind: 'iot_publish', topic: 'escuela/camara', sensor: 'temperatura' },
      ],
    });

    const narrative = result.narrativeSteps
      .map((step) => step.explanation)
      .join(' ');
    expect(narrative).toContain('placa Camera Node');
    expect(narrative).toContain('red “Escuela_BiTech”');
    expect(narrative).toContain('canal “escuela/camara”');
    expect(result.summarySentence).toBe(
      'Este programa: configura → mide → actúa → comunica → vuelve a medir.'
    );
  });

  it('describe condiciones lógicas como decisiones y no como repeticiones', () => {
    const condition = describeCondition({
      kind: 'logical',
      operator: 'AND',
      left: {
        kind: 'comparison',
        leftSensor: 'temperatura',
        operator: '>',
        rightNumber: 28,
      },
      right: {
        kind: 'comparison',
        leftSensor: 'humedadAmbiente',
        operator: '<',
        rightNumber: 40,
      },
    });

    expect(condition.comparisonText).toContain('y además');
    expect(condition.pedagogicalMeaning).toContain(
      'las dos comparaciones deben ser verdaderas'
    );
    expect(condition.pedagogicalMeaning).not.toContain('repite');
  });

  it('mantiene utilidades determinísticas para resumir acciones reales', () => {
    expect(
      formatActionsList([
        { kind: 'relay_on' },
        { kind: 'digital_out_on' },
        { kind: 'wait', seconds: 1 },
      ])
    ).toBe(
      'activa el relay, activa la salida digital y espera 1 segundo(s)'
    );
  });

  it('explica el canal Bi-Tech como identificación visible y no como contraseña', () => {
    const result = interpretProgram({
      device: 'garden-node',
      setupStatements: [
        { kind: 'iot_connect_channel', channel: 1, blockId: 'channel-1' },
      ],
      loopStatements: [],
    });

    const channelStep = result.narrativeSteps.find(
      (step) => step.blockId === 'channel-1'
    );
    expect(channelStep?.blockLabel).toBe(
      'conectar a Smart Garden Lab — canal 1'
    );
    expect(channelStep?.explanation).toContain(
      'permitirá identificar la placa'
    );
    expect(channelStep?.explanation).toContain('no funciona como contraseña');
    expect(result.summarySentence).toBe('Este programa: comunica.');
  });
});
