const A = require("arcsecond");
const helloParser = A.choice([
  A.str("hello"),
  A.str("world"),
  A.str("foo"),
  A.str("bar"),
  A.whitespace,
]);

const stringParser = A.many(helloParser);

console.log(stringParser.run("hello world"));
