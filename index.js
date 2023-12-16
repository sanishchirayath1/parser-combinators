const { letter } = require("arcsecond");

const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result,
});

const updateParserResult = (state, result) => ({
  ...state,
  result,
});

const updateParserError = (state, error) => ({
  ...state,
  isError: true,
  error,
});

const letterRegex = /^[A-Za-z]+/;
const digitRegex = /^[0-9]+/;

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run(target) {
    const initialState = {
      target,
      index: 0,
      result: null,
      isError: false,
      error: null,
    };
    return this.parserStateTransformerFn(initialState);
  }

  map(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) {
        return nextState;
      }

      return updateParserResult(nextState, fn(nextState.result));
    });
  }

  errorMap(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (!nextState.isError) {
        return nextState;
      }

      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }
}

const str = (s) =>
  new Parser((parserState) => {
    const { target, index, isError } = parserState;

    if (isError) {
      return parserState;
    }

    const slicedTarget = target.slice(index);

    if (slicedTarget.length === 0) {
      return updateParserError(
        parserState,
        index,
        `str: Tried to match ${s} but got Unexpected end of input`
      );
    }

    if (slicedTarget.startsWith(s)) {
      return updateParserState(parserState, index + s.length, s);
    }

    return updateParserError(
      parserState,
      index,
      `str: Tried to match ${s} but got ${target.slice(index, index + 10)}...`
    );
  });

const letters = new Parser((parserState) => {
  const { target, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = target.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      index,
      `letters: Tried to match but got Unexpected end of input`
    );
  }

  const letterMatch = slicedTarget.match(letterRegex);

  if (letterMatch) {
    return updateParserState(
      parserState,
      index + letterMatch[0].length,
      letterMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const digits = new Parser((parserState) => {
  const { target, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = target.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      index,
      `letters: Tried to match but got Unexpected end of input`
    );
  }

  const digitMatch = slicedTarget.match(digitRegex);

  if (digitMatch) {
    return updateParserState(
      parserState,
      index + digitMatch[0].length,
      digitMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const sequenceOf = (parsers) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    const results = [];
    let nextState = parserState;

    for (const parser of parsers) {
      nextState = parser.parserStateTransformerFn(nextState);
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });

const choice = (parsers) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    for (const parser of parsers) {
      const nextState = parser.parserStateTransformerFn(parserState);

      if (!nextState.isError) {
        return nextState;
      }
    }

    return updateParserError(
      parserState,
      `choice: Unable to match with any parser at index ${parserState.index}`
    );
  });

const many = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      testState = parser.parserStateTransformerFn(nextState);

      if (!testState.isError) {
        results.push(testState.result);
        nextState = testState;
      } else {
        done = true;
      }
    }

    return updateParserResult(nextState, results);
  });

const manyOne = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;

    const results = [];
    let done = false;

    while (!done) {
      testState = parser.parserStateTransformerFn(nextState);

      if (!testState.isError) {
        results.push(testState.result);
        nextState = testState;
      } else {
        done = true;
      }
    }

    if (results.length === 0) {
      return updateParserError(nextState, `manyOne: Unable to match any input`);
    }

    return updateParserResult(nextState, results);
  });

// const parser = sequenceOf([
//   str("hello world!")
//     .map((_) => "Halla bhol")
//     .errorMap((err, index) => {
//       return `Custom error at ${index}: ${err}`;
//     }),
//   str("foo bar!"),
//   letters,
//   digits,
// ]);

const parser = many(choice([letters, digits]));

// console.log(parser.run("hello world!foo bar!"));
// console.log(parser.run(""));
// console.log(parser.run("hello world!foo bar!"));
console.log(parser.run("aws1234aws7qwe"));
