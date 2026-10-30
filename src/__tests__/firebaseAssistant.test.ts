import { describe, expect, it } from 'vitest';
import { BITECH_ASSISTANT_MODEL, BITECH_TUTOR_INSTRUCTIONS } from '../assistant/assistantConfig';
import { buildPrompt } from '../assistant/firebaseAssistant';
import {
  enforcePedagogicalGuardrails,
  sanitizeAssistantContext,
  sanitizeAssistantHistory,
  sanitizeAssistantText,
} from '../assistant/assistantSecurity';
import { AssistantRequestContext } from '../assistant/bitechAssistantContext';

const missingSoilContext: AssistantRequestContext = {
  profile: 'Garden Node Bi-Tech (ESP32)',
  mode: 'program',
  programSummary: 'Sensor de humedad de suelo con GPIO pendiente.',
  validation: ['Todavía falta elegir un GPIO compatible.'],
  selectedBlocks: [
    {
      component: 'humedad de suelo',
      signalType: 'señal analógica',
      requiredCapability: 'ADC',
      pin: null,
      selectionState: 'missing',
      physicalEvidence: 'not-validated',
    },
  ],
  channel: null,
};

describe('Asistente Bi-Tech mediante Firebase AI Logic', () => {
  it('centraliza un modelo Flash-Lite vigente y el prompt pedagógico', () => {
    expect(BITECH_ASSISTANT_MODEL).toBe('gemini-3.5-flash-lite');
    expect(BITECH_TUTOR_INSTRUCTIONS).toContain(
      'componente → tipo de señal → capacidad requerida'
    );
    expect(BITECH_TUTOR_INSTRUCTIONS).toContain('protocolo digital temporizado');
    expect(BITECH_TUTOR_INSTRUCTIONS).toContain('No indiques GPIO34');
  });

  it('mantiene contexto e historial compactos y redacta credenciales', () => {
    const context = sanitizeAssistantContext({
      ...missingSoilContext,
      profile: 'Garden Node 192.168.1.20',
      programSummary: 'ssid=Aula password=secreto token=privado',
    });
    const history = sanitizeAssistantHistory([
      { role: 'user', text: 'api_key=valor-de-prueba' },
      { role: 'assistant', text: 'Revisemos el programa.' },
    ]);
    const prompt = buildPrompt({
      message: sanitizeAssistantText('¿Qué hace este bloque?', 1000),
      context,
      history,
    });

    expect(prompt).not.toMatch(/192\.168|Aula|secreto|privado|valor-de-prueba/);
    expect(prompt).toContain('[REDACTED]');
    expect(prompt).not.toContain('workspaceXml');
    expect(prompt).not.toContain('WIFI_PASSWORD');
  });

  it('impide determinísticamente que Gemini elija GPIO34', () => {
    const reply = enforcePedagogicalGuardrails({
      reply: 'Usá GPIO34 para poder continuar.',
      context: missingSoilContext,
    });

    expect(reply).toContain('señal analógica');
    expect(reply).toContain('ADC');
    expect(reply).toContain('elegí');
    expect(reply).not.toContain('GPIO34');
  });

  it.each([
    '¿Por qué no puedo continuar?',
    '¿Qué hace este bloque?',
    'Explicame mi programa.',
  ])('incorpora la consulta pedagógica sin ampliar el contexto: %s', (question) => {
    const prompt = buildPrompt({
      message: question,
      context: missingSoilContext,
      history: [],
    });
    expect(prompt).toContain(question);
    expect(prompt).toContain('humedad de suelo');
    expect(prompt).toContain('ADC');
    expect(prompt).not.toContain('GPIO34');
  });
});
