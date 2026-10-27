import { describe, expect, it } from 'vitest';
import {
  interpretProgram,
  describeCondition,
  formatSensorDisplayName,
  formatActionsList,
} from '../interpreter/programInterpreter';
import { ParsedProgram } from '../types/studio';

describe('Intérprete didáctico del programa (V0.5B)', () => {
  it('maneja un programa vacío correctamente', () => {
    const emptyProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [],
    };

    const result = interpretProgram(emptyProgram);
    expect(result.isEmpty).toBe(true);
    expect(result.totalStatements).toBe(0);
    expect(result.activeCategories).toHaveLength(0);
  });

  it('interpreta el ejemplo clave: si humedad del suelo < 30 → encender bomba', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [
            {
              kind: 'bomba_on',
            },
          ],
        },
      ],
    };

    const result = interpretProgram(program);
    expect(result.isEmpty).toBe(false);
    expect(result.activeCategories).toContain('observe');
    expect(result.activeCategories).toContain('decide');
    expect(result.activeCategories).toContain('act');
    expect(result.activeCategories).toContain('repeat');

    // Categoría Decidir
    const decideItems = result.itemsByCategory.decide;
    expect(decideItems).toHaveLength(1);
    expect(decideItems[0].explanation).toBe(
      'La placa compara humedad del suelo con el valor 30. Si detecta que el suelo necesita agua, activa la bomba de riego.'
    );

    // Categoría Observar / medir
    const observeItems = result.itemsByCategory.observe;
    expect(observeItems).toHaveLength(1);
    expect(observeItems[0].title).toBe('Sensor de humedad del suelo');

    // Categoría Actuar
    const actItems = result.itemsByCategory.act;
    expect(actItems).toHaveLength(1);
    expect(actItems[0].title).toBe('Activar bomba de riego');

    // Categoría Repetir
    const repeatItems = result.itemsByCategory.repeat;
    expect(repeatItems).toHaveLength(1);
  });

  it('interpreta condiciones con rama si-no (elseBranch)', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on' }],
          elseBranch: [{ kind: 'bomba_off' }],
        },
        {
          kind: 'wait',
          seconds: 2,
        },
      ],
    };

    const result = interpretProgram(program);
    const decideItem = result.itemsByCategory.decide[0];
    expect(decideItem.explanation).toContain(
      'La placa compara humedad del suelo con el valor 30. Si detecta que el suelo necesita agua, activa la bomba de riego. De lo contrario, apaga la bomba de riego.'
    );

    // Categoría Repetir con temporización
    expect(result.itemsByCategory.repeat[0].explanation).toContain(
      'pausa de 2 segundo(s)'
    );
  });

  it('clasifica setup en Al comenzar y telemetría en Comunicar', () => {
    const camProgram: ParsedProgram = {
      device: 'camera-node',
      setupStatements: [
        { kind: 'cam_config' },
        { kind: 'cam_resolution', resolution: 'QVGA (320x240)' },
        { kind: 'cam_wifi', ssid: 'Escuela_BiTech' },
        { kind: 'cam_init' },
      ],
      loopStatements: [
        { kind: 'cam_capture' },
        { kind: 'data_log', label: 'temp', sensor: 'temperatura' },
        { kind: 'iot_publish', topic: 'escuela/huerta/temp', sensor: 'temperatura' },
      ],
    };

    const result = interpretProgram(camProgram);
    expect(result.activeCategories).toContain('start');
    expect(result.activeCategories).toContain('act');
    expect(result.activeCategories).toContain('communicate');

    // Al comenzar
    expect(result.itemsByCategory.start).toHaveLength(4);
    expect(result.itemsByCategory.start[0].title).toContain('Configurar pines');
    expect(result.itemsByCategory.start[2].explanation).toContain('Escuela_BiTech');

    // Comunicar
    expect(result.itemsByCategory.communicate).toHaveLength(2);
    expect(result.itemsByCategory.communicate[0].title).toContain('Registrar por serie');
    expect(result.itemsByCategory.communicate[1].title).toContain('Publicar en canal IoT');
  });

  it('soporta sensores de NodeMCU ESP8266 (A0, relay, salida digital)', () => {
    const nodemcuProgram: ParsedProgram = {
      device: 'nodemcu-esp8266',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'entradaAnalogicaA0',
            operator: '>',
            rightNumber: 600,
          },
          thenBranch: [{ kind: 'relay_on' }, { kind: 'digital_out_on' }],
          elseBranch: [{ kind: 'relay_off' }],
        },
      ],
    };

    const result = interpretProgram(nodemcuProgram);
    expect(result.itemsByCategory.observe[0].title).toContain('Canal analógico A0');
    expect(result.itemsByCategory.decide[0].explanation).toContain(
      'activa el relay y activa la salida digital. De lo contrario, desactiva el relay.'
    );
  });

  it('interpreta condiciones lógicas compuestas (AND / OR) y expresiones matemáticas', () => {
    const complexProgram: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
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
              leftExpr: {
                kind: 'math_op',
                operator: '-',
                left: { kind: 'sensor_read', sensor: 'humedadSuelo' },
                rightNumber: 10,
              },
              operator: '<',
              rightNumber: 20,
            },
          },
          thenBranch: [
            { kind: 'bomba_on' },
            { kind: 'luz_on' },
          ],
        },
      ],
    };

    const result = interpretProgram(complexProgram);
    expect(result.activeCategories).toContain('observe');
    expect(result.activeCategories).toContain('decide');
    expect(result.activeCategories).toContain('act');

    const decideItem = result.itemsByCategory.decide[0];
    expect(decideItem.explanation).toContain('ambas condiciones deben cumplirse a la vez');
    expect(decideItem.explanation).toContain('activa la bomba de riego y enciende la iluminación');
  });

  it('incluye el resumen del ciclo pedagógico con las categorías activas', () => {
    const program: ParsedProgram = {
      device: 'garden-node',
      setupStatements: [],
      loopStatements: [
        {
          kind: 'if',
          condition: {
            kind: 'comparison',
            leftSensor: 'humedadSuelo',
            operator: '<',
            rightNumber: 30,
          },
          thenBranch: [{ kind: 'bomba_on' }],
        },
      ],
    };

    const result = interpretProgram(program);
    expect(result.summarySentence).toBe(
      'El programa ejecuta el ciclo pedagógico: Observar / medir → Decidir → Actuar → Repetir.'
    );
  });
});
