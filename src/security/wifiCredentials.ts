import { ParsedProgram, StatementNode } from '../types/studio';

export const HIDDEN_WIFI_PASSWORD = '••••••••••••';

/** Oculta declaraciones Arduino de WIFI_PASSWORD sin depender de su valor. */
export function redactWifiCredentials(code: string): string {
  return code.replace(
    /((?:const\s+char\s*\*\s*WIFI_PASSWORD\s*=|#define\s+WIFI_PASSWORD)\s*)"(?:\\.|[^"\\])*"/g,
    `$1"${HIDDEN_WIFI_PASSWORD}"`
  );
}

export function containsWifiCredentials(code: string): boolean {
  return /(?:const\s+char\s*\*\s*WIFI_PASSWORD\s*=|#define\s+WIFI_PASSWORD)/.test(
    code
  );
}

function redactStatements(statements: StatementNode[]): StatementNode[] {
  return statements.map((statement) => {
    if (statement.kind === 'cam_wifi') {
      return { ...statement, password: HIDDEN_WIFI_PASSWORD };
    }
    if (statement.kind === 'if') {
      return {
        ...statement,
        thenBranch: redactStatements(statement.thenBranch),
        elseBranch: statement.elseBranch
          ? redactStatements(statement.elseBranch)
          : undefined,
      };
    }
    return statement;
  });
}

/** Produce una copia apta para ayudas/asistentes, sin la credencial real. */
export function redactProgramWifiPasswords(
  program: ParsedProgram
): ParsedProgram {
  return {
    ...program,
    setupStatements: redactStatements(program.setupStatements),
    loopStatements: redactStatements(program.loopStatements),
  };
}
