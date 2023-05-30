export function parse(sourceCode, options) {
  const { base } = {
    base: 0,
    ...options,
  };
  const context = {};
  const statements = [];
  let i = 0;
  let j = 0;

  function readString(validRegExp = /[^ \t]/) {
    while (sourceCode[j] !== undefined && !validRegExp.test(sourceCode[j])) j++;
    i = j;
    while (sourceCode[j] !== undefined && validRegExp.test(sourceCode[j])) j++;
    const string = sourceCode.slice(i, j);
    i = j;
    return string;
  }

  function skipSpace(spaceRegExp = /[ \t]/) {
    while (spaceRegExp.test(sourceCode[j])) j++;
    i = j;
  }

  function readClosedString(stringCharacter) {
    j++;
    if (sourceCode[j] === stringCharacter) {
      j++;
    } else {
      j++;
      const endCharacterRegExp = new RegExp(`[^\\\\]${stringCharacter}`);
      let testedString = sourceCode.slice(j - 1, j + 1);
      while (!endCharacterRegExp.test(testedString)) {
        j++;
        testedString = testedString[1] + sourceCode[j];
      }
      j++;
    }
    const closedString = sourceCode.slice(i, j);
    i = j;
    return closedString;
  }

  function readClosedStructure(startCharacter, endCharacter) {
    let depth = 1;
    const temp_i = i;
    j++;
    while (depth && sourceCode[j]) {
      if (/["'`]/.test(sourceCode[j])) {
        switch (sourceCode[j]) {
          case '"':
            readClosedString('"');
            break;
          case '\'':
            readClosedString('\'');
            break;
          case '\'':
            readClosedString('`');
            break;
        }
      }
      if (sourceCode[j] === startCharacter) depth++;
      if (sourceCode[j] === endCharacter) depth--;
      j++;
    }
    if (depth) throw new Error(`${startCharacter} is not closed!`);
    const closedStructure = sourceCode.slice(temp_i, j);
    i = j;
    return closedStructure;
  }

  function readExpression() {
    skipSpace();
    let expression = undefined;
    switch (sourceCode[i]) {
      case '[':
        expression = readClosedStructure('[', ']');
        break;
      case '{':
        expression = readClosedStructure('{', '}');
        break;
      case '(':
        expression = readClosedStructure('(', ')');
        break;
      case '"':
        expression = readClosedString('"');
        break;
      case '\'':
        expression = readClosedString('\'');
        break;
      case '`':
        expression = readClosedString('`');
        break;
      default:
        expression = readString(/[^\n;,]/);
        break;
    }
    return expression;
  }

  function handleVariableDeclaration(declarationType) {
    skipSpace();
    if (!/[_a-zA-Z]/.test(sourceCode[i])) throw new Error(`Variable cannot start with ${sourceCode[i]}!`)
    const variableName = readString(/\w/);
    let valueExpression = undefined;
    let nextVariableDeclaration = false;
    skipSpace();
    if (sourceCode[i] === '=') {
      j++;
      i = j;
      valueExpression = readExpression();
      skipSpace();
      if (sourceCode[i] === ',') {
        nextVariableDeclaration = true;
      }
    } else if (sourceCode[i] === ',') {
      nextVariableDeclaration = true;
    }
    context[variableName] = {
      type: 'variable',
      variableName,
      valueExpression,
    };
    statements.push({
      type: 'variable-declaration',
      variableName,
      valueExpression,
      start: base + sourceCode.lastIndexOf(declarationType, i),
      end: base + i,
    });
    if (nextVariableDeclaration) {
      handleVariableDeclaration();
    }
  }

  function handleFunctionDeclaration() {
    const start = base + sourceCode.lastIndexOf('function', i);
    skipSpace();
    let functionName = undefined;
    let parameterString = undefined;
    let functionBodyString = undefined;
    let parsed = undefined;
    if (/[_a-zA-A]/.test(sourceCode[i])) {
      functionName = readString(/\w/);
      skipSpace();
      if (sourceCode[i] === '(') {
        parameterString = readClosedStructure('(', ')');
        skipSpace();
        if (sourceCode[i] === '{') {
          const base = i + 1;
          functionBodyString = readClosedStructure('{', '}');
          parsed = parse(functionBodyString.slice(1, -1), { base });
        }
      }
    }
    context[functionName] = {
      type: 'function',
      functionName,
      parameterString,
      functionBodyString,
      parsed,
    };
    statements.push({
      type: 'function-declaration',
      functionName,
      parameterString,
      functionBodyString,
      start,
      end: base + i,
    });
  }

  function handleReturn() {
    skipSpace();
    const returnExpression = readExpression();
    statements.push({
      type: 'return',
      returnExpression,
    });
  }

  function appendLastExpression() {
    const lastStatement = statements.at(-1);
    skipSpace();
    readString(/[^ \t\n;]/);
    const { type, variableName, valueExpression } = lastStatement;
    switch (type) {
      case 'variable-declaration':
        lastStatement.valueExpression = sourceCode.slice(sourceCode.lastIndexOf(valueExpression, i), i);
        lastStatement.end = base + i;
        context[variableName].valueExpression = lastStatement.valueExpression;
        break;
    }
  }

  let nextString = readString(/[^ \t\n;]/);
  while (nextString) {
    if (/^(([\+\-\*\/\?:])|(\|\|)|(&&))/.test(nextString)) {
      appendLastExpression();
      nextString = readString(/[^ \t\n;]/);
      continue;
    }
    switch (nextString) {
      case 'var':
        handleVariableDeclaration('var');
        nextString = readString(/[^ \t\n;]/);
        break;
      case 'let':
        handleVariableDeclaration('let');
        nextString = readString(/[^ \t\n;]/);
        break;
      case 'const':
        handleVariableDeclaration('const');
        nextString = readString(/[^ \t\n;]/);
        break;
      case 'function':
        handleFunctionDeclaration();
        nextString = readString(/[^ \t\n;]/);
        break;
      case 'return':
        handleReturn();
        nextString = readString(/[^ \t\n;]/);
        break;
      default:
        console.log(`未处理：>|${JSON.stringify(nextString)}|<`);
        nextString = readString(/[^ \t]/);
        break;
    }
  }

  return {
    context,
    statements,
  };
}

function s(value) {
  return `>|${JSON.stringify(value)}|<`;
}
